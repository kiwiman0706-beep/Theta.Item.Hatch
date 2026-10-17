package jp.omoide.closet;

import android.content.*;
import android.graphics.BitmapFactory;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class DriveSync {
    interface Progress{void show(String message);}
    private final Context context;private final MainActivity.DB db;private final SharedPreferences prefs;
    DriveSync(Context c,MainActivity.DB db){context=c;this.db=db;prefs=c.getSharedPreferences("closet",Context.MODE_PRIVATE);}
    JSONObject run(DriveApi api,String folder,Progress progress)throws Exception {
        JSONObject folderInfo=api.folder(folder);List<JSONObject> files=api.list(folder);
        Map<String,String> remoteFiles=new HashMap<>();for(JSONObject file:files){String name=file.optString("name");String existing=remoteFiles.get(name),id=file.getString("id");if(existing==null||id.compareTo(existing)<0)remoteFiles.put(name,id);}
        File cache=new File(context.getFilesDir(),"sync/"+folder),bank=new File(cache,"photos"),records=new File(cache,"records");bank.mkdirs();records.mkdirs();
        List<JSONObject> remote=new ArrayList<>();int downloaded=0,uploaded=0;
        for(Map.Entry<String,String> file:remoteFiles.entrySet()){
            String name=file.getKey();if(!name.matches("omoide-(?:record|person)_[a-f0-9-]{36}_[a-f0-9-]{36}\\.json"))continue;
            File local=new File(records,name);byte[] bytes;
            if(local.isFile())bytes=SyncStore.read(local,1024*1024);else{progress.show("変更履歴を確認しています（"+(remote.size()+1)+"）");bytes=api.download(file.getValue(),1024*1024);downloaded++;}
            JSONObject envelope=new JSONObject(new String(bytes,StandardCharsets.UTF_8));if(!"omoide-closet-record".equals(envelope.optString("format"))||(envelope.optInt("version")<1||envelope.optInt("version")>2))throw new IOException("同期フォルダの記録形式が一致しません");
            JSONObject item=envelope.getJSONObject("item");SyncMerge.validate(item);if(!name.equals(recordName(item)))throw new IOException("同期記録の名前と内容が一致しません");remote.add(item);if(!local.exists())SyncStore.atomic(local,bytes);
        }
        JSONArray all=db.entities();List<JSONObject> local=new ArrayList<>();Map<String,JSONObject> before=new HashMap<>();
        for(int i=0;i<all.length();i++){
            JSONObject item=all.getJSONObject(i);JSONObject assets=SyncStore.assets(context,item,true),s=item.optJSONObject("_sync");
            if(s==null){item.put("_sync",SyncMerge.baseline(item,assets));db.putEntityRaw(item);}
            else if(!SyncMerge.canonical(assets).equals(SyncMerge.canonical(s.optJSONObject("assets")))){item=SyncMerge.touch(item,item,assets,device());db.putEntityRaw(item);}
            local.add(item);before.put(item.getString("id"),item);
            for(Map.Entry<String,String> asset:SyncStore.paths(item).entrySet()){String name=assetName(assets.getString(asset.getKey()),asset.getKey());File target=new File(bank,name);if(!target.exists())SyncStore.atomic(target,SyncStore.read(new File(new File(context.getFilesDir(),"media"),asset.getValue()),12*1024*1024));}
        }
        SyncMerge.Result merged=SyncMerge.merge(local,remote);
        for(int i=0;i<merged.items.length();i++){
            JSONObject item=merged.items.getJSONObject(i),assets=item.getJSONObject("_sync").getJSONObject("assets");progress.show("写真を統合しています（"+(i+1)+" / "+merged.items.length()+"）");
            for(String kind:SyncStore.paths(item).keySet()){
                String hash=assets.getString(kind),name=assetName(hash,kind);File cached=new File(bank,name);byte[] bytes;
                if(cached.isFile()){bytes=SyncStore.read(cached,12*1024*1024);if(!SyncMerge.sha(bytes).equals(hash))throw new IOException("保存した同期写真の内容を確認できません");}
                else{String remoteId=remoteFiles.get(name);if(remoteId==null)throw new IOException("共有フォルダに写真が不足しています。元の端末から再同期してください。");bytes=api.download(remoteId,12*1024*1024);if(!SyncMerge.sha(bytes).equals(hash))throw new IOException("同期写真の内容が一致しません");SyncStore.atomic(cached,bytes);downloaded++;}
                BitmapFactory.Options size=new BitmapFactory.Options();size.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,size);if(size.outWidth<1||size.outHeight<1||size.outWidth>2048||size.outHeight>2048)throw new IOException("同期写真のサイズが不正です");
                if(!remoteFiles.containsKey(name)){JSONObject created=api.upload(folder,name,SyncStore.jpeg(kind)?"image/jpeg":"image/png",bytes);remoteFiles.put(name,created.getString("id"));uploaded++;}
            }
            String name=recordName(item);if(!remoteFiles.containsKey(name)){
                byte[] bytes=new JSONObject().put("format","omoide-closet-record").put("version",2).put("item",item).toString().getBytes(StandardCharsets.UTF_8);
                JSONObject created=api.upload(folder,name,"application/json",bytes);remoteFiles.put(name,created.getString("id"));SyncStore.atomic(new File(records,name),bytes);uploaded++;
            }
        }
        int added=0,updated=0,families=0;List<JSONObject> changed=new ArrayList<>();
        for(int i=0;i<merged.items.length();i++){JSONObject item=merged.items.getJSONObject(i),prior=before.get(item.getString("id"));if(prior==null||!SyncMerge.revision(prior).equals(SyncMerge.revision(item))){if(SyncStore.person(item))families++;else if(prior==null)added++;else updated++;changed.add(item);}}
        // All transfers and validation finish before replacing any visible local photographs.
        for(JSONObject item:changed){JSONObject assets=item.getJSONObject("_sync").getJSONObject("assets");for(Map.Entry<String,String> asset:SyncStore.paths(item).entrySet())SyncStore.atomic(new File(new File(context.getFilesDir(),"media"),asset.getValue()),SyncStore.read(new File(bank,assetName(assets.getString(asset.getKey()),asset.getKey())),12*1024*1024));}
        android.database.sqlite.SQLiteDatabase sql=db.getWritableDatabase();sql.beginTransaction();try{for(JSONObject item:changed)db.putEntityRaw(SyncStore.person(item)?item:ItemTypes.normalize(item));sql.setTransactionSuccessful();}finally{sql.endTransaction();}
        long now=System.currentTimeMillis();prefs.edit().putString("driveFolder",folder).putString("driveFolderName",folderInfo.getString("name")).putLong("lastSync",now).commit();MemoryWidget.updateAll(context);
        return new JSONObject().put("added",added).put("updated",updated).put("families",families).put("conflicts",merged.conflicts).put("uploaded",uploaded).put("downloaded",downloaded).put("lastSync",now).put("folderName",folderInfo.getString("name"));
    }
    private String device(){return prefs.getString("deviceName",android.os.Build.MODEL);}
    static String recordName(JSONObject item)throws Exception{return (SyncStore.person(item)?"omoide-person_":"omoide-record_")+item.getString("id")+"_"+SyncMerge.revision(item)+".json";}
    static String assetName(String hash,String kind){return "omoide-photo_"+hash+(SyncStore.jpeg(kind)?".jpg":".png");}
}
