package jp.omoide.closet;

import android.content.*;
import android.database.sqlite.SQLiteDatabase;
import android.graphics.BitmapFactory;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.*;

/** Backup all referenced photographs; importing never overwrites existing memories. */
final class AlbumBackup {
    static void write(Context context,MainActivity.DB db,OutputStream stream)throws Exception {
        JSONArray items=db.all(),families=db.people(),all=db.entities();Set<String> photographs=new TreeSet<>();for(int i=0;i<all.length();i++)photographs.addAll(SyncStore.paths(all.getJSONObject(i)).values());
        JSONObject manifest=new JSONObject().put("format","omoide-closet").put("version",2).put("exported",System.currentTimeMillis()).put("items",items).put("families",families).put("children",new JSONArray(context.getSharedPreferences("closet",0).getString("children","[]")));
        try(ZipOutputStream out=new ZipOutputStream(stream)){
            out.putNextEntry(new ZipEntry("manifest.json"));out.write(manifest.toString(2).getBytes(StandardCharsets.UTF_8));out.closeEntry();
            for(String name:photographs){File file=new File(new File(context.getFilesDir(),"media"),name);if(!file.isFile())throw new IOException("写真の一部が見つかりません");out.putNextEntry(new ZipEntry("media/"+name));try(InputStream in=new FileInputStream(file)){copy(in,out);}out.closeEntry();}
            out.putNextEntry(new ZipEntry("closet.html"));PortableAlbum.write(context,out,items,families);out.closeEntry();
            out.putNextEntry(new ZipEntry("READ-ME.txt"));out.write("ZIPを展開してcloset.htmlをブラウザで開いてください。表・裏・関連写真・家族の顔写真を埋め込んだ閲覧用アルバムで、ネット接続は不要です。裏面は上下スワイプまたは『表／裏』で切り替えられます。編集と同期はAndroidアプリで行います。復元には1.3.0以降のアプリをお使いください。Driveのプレビューで開けない場合は、ダウンロードしてブラウザで開いてください。".getBytes(StandardCharsets.UTF_8));out.closeEntry();
        }
    }
    static JSONObject restore(Context context,MainActivity.DB db,InputStream stream)throws Exception {
        File staging=new File(context.getCacheDir(),"import-"+UUID.randomUUID());staging.mkdirs();JSONObject manifest=null;
        try{
            int count=0;long total=0;Set<String> names=new HashSet<>();
            try(ZipInputStream in=new ZipInputStream(stream)){ZipEntry entry;while((entry=in.getNextEntry())!=null){String name=entry.getName();if(entry.isDirectory())continue;if(++count>20000||!names.add(name))throw new IOException("バックアップの構成が不正です");
                if(name.equals("closet.html")||name.equals("READ-ME.txt")){byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1){total+=n;if(total>500L*1024*1024)throw new IOException("一度に復元できる容量は500MBまでです");}continue;}
                if(!name.equals("manifest.json")&&!name.matches("media/[a-f0-9-]{36}(?:_full)?\\.(?:jpg|png)"))throw new IOException("おもいでクローゼットのバックアップを選んでください");
                byte[] bytes=read(in,name.equals("manifest.json")?8*1024*1024:12*1024*1024);total+=bytes.length;if(total>500L*1024*1024)throw new IOException("一度に復元できる容量は500MBまでです");
                if(name.equals("manifest.json"))manifest=new JSONObject(new String(bytes,StandardCharsets.UTF_8));else SyncStore.atomic(new File(staging,name.substring(6)),bytes);
            }}
            if(manifest==null||!"omoide-closet".equals(manifest.optString("format"))||manifest.optInt("version")<1||manifest.optInt("version")>2)throw new IOException("対応するバックアップではありません");
            JSONArray items=manifest.getJSONArray("items"),families=manifest.optJSONArray("families");if(families==null)families=new JSONArray();List<JSONObject> all=new ArrayList<>();Set<String> ids=new HashSet<>();
            for(int i=0;i<families.length();i++){JSONObject person=families.getJSONObject(i);if(!SyncStore.person(person))throw new IOException("家族の形式が不正です");all.add(person);}for(int i=0;i<items.length();i++){JSONObject item=items.getJSONObject(i);if(SyncStore.person(item))throw new IOException("品物の形式が不正です");all.add(item);}
            for(JSONObject record:all){String id=SyncStore.imageId(record.getString("id"));if(!ids.add(id))throw new IOException("記録のIDが重複しています");if(record.has("_sync"))SyncMerge.validate(record);Map<String,String> paths=SyncStore.paths(record);
                for(Map.Entry<String,String> asset:paths.entrySet()){File file=new File(staging,asset.getValue());if(!file.isFile())throw new IOException("写真が不足しています");BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(file.getAbsolutePath(),bounds);if(bounds.outWidth<1||bounds.outHeight<1||bounds.outWidth>2048||bounds.outHeight>2048)throw new IOException("写真のサイズが不正です");if(record.has("_sync")&&!SyncMerge.sha(SyncStore.read(file,12*1024*1024)).equals(record.getJSONObject("_sync").getJSONObject("assets").getString(asset.getKey())))throw new IOException("写真と記録の内容が一致しません");}
            }
            List<JSONObject> addedRecords=new ArrayList<>();int added=0,skipped=0,familyAdded=0;Set<String> copyNames=new TreeSet<>();
            for(JSONObject record:all){JSONObject existing=SyncStore.person(record)?db.getPerson(record.getString("id")):db.get(record.getString("id"));if(existing!=null){if(!SyncStore.person(record))skipped++;continue;}addedRecords.add(record);if(SyncStore.person(record))familyAdded++;else added++;copyNames.addAll(SyncStore.paths(record).values());}
            for(String name:copyNames){File destination=new File(new File(context.getFilesDir(),"media"),name);if(destination.isFile()&&!SyncMerge.sha(SyncStore.read(destination,12*1024*1024)).equals(SyncMerge.sha(SyncStore.read(new File(staging,name),12*1024*1024))))throw new IOException("写真のIDが既存データと一致しません。Drive同期で統合してください。");}
            for(String name:copyNames){File destination=new File(new File(context.getFilesDir(),"media"),name);if(!destination.exists())SyncStore.atomic(destination,SyncStore.read(new File(staging,name),12*1024*1024));}
            SQLiteDatabase sql=db.getWritableDatabase();sql.beginTransaction();try{for(JSONObject record:addedRecords)db.putEntityRaw(record);sql.setTransactionSuccessful();}finally{sql.endTransaction();}
            SharedPreferences prefs=context.getSharedPreferences("closet",0);JSONArray importedNames=manifest.optJSONArray("children");Set<String> people=new LinkedHashSet<>();JSONArray currentNames=new JSONArray(prefs.getString("children","[]"));for(int i=0;i<currentNames.length();i++)people.add(currentNames.getString(i));if(importedNames!=null)for(int i=0;i<importedNames.length();i++)people.add(importedNames.getString(i));prefs.edit().putString("children",new JSONArray(people).toString()).commit();MemoryWidget.updateAll(context);
            return new JSONObject().put("added",added).put("skipped",skipped).put("families",familyAdded);
        }finally{File[] files=staging.listFiles();if(files!=null)for(File file:files)file.delete();staging.delete();}
    }
    private static byte[] read(InputStream in,int limit)throws IOException{ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[16384];int n,total=0;while((n=in.read(b))!=-1){total+=n;if(total>limit)throw new IOException("ファイルが大きすぎます");out.write(b,0,n);}return out.toByteArray();}
    private static void copy(InputStream in,OutputStream out)throws IOException{byte[] b=new byte[16384];int n;while((n=in.read(b))!=-1)out.write(b,0,n);}
}
