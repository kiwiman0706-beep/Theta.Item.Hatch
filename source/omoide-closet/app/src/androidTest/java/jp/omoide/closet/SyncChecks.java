package jp.omoide.closet;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.os.Bundle;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Two isolated local stores with an in-memory Drive API; no personal cloud access. */
final class SyncChecks {
    private int checks=0;
    private void check(boolean b,String message){if(!b)throw new AssertionError(message);checks++;}
    static final class Device extends ContextWrapper {
        final File files;final String label;
        Device(Context c,File files,String label){super(c);this.files=files;this.label=label;files.mkdirs();}
        @Override public Context getApplicationContext(){return this;}
        @Override public File getFilesDir(){return files;}
        @Override public SharedPreferences getSharedPreferences(String name,int mode){return super.getSharedPreferences("sync-test-"+label+"-"+name,mode);}
    }
    static final class Cloud extends DriveApi {
        final Map<String,byte[]> content=new LinkedHashMap<>();final Map<String,String> names=new LinkedHashMap<>();boolean fail=false;int uploadsUntilFailure=-1;
        Cloud(){super("");}
        @Override JSONObject folder(String id)throws Exception{return new JSONObject().put("id",id).put("name","家族の思い出");}
        @Override List<JSONObject> list(String folder)throws Exception{if(fail)throw new IOException("テスト用の通信断");List<JSONObject> list=new ArrayList<>();for(String id:content.keySet())list.add(new JSONObject().put("id",id).put("name",names.get(id)));return list;}
        @Override byte[] download(String id,int limit)throws Exception{byte[] bytes=content.get(id);if(bytes==null)throw new IOException("missing");return bytes;}
        @Override JSONObject upload(String folder,String name,String mime,byte[] bytes)throws Exception{if(uploadsUntilFailure==0)throw new IOException("テスト用の転送途中の通信断");if(uploadsUntilFailure>0)uploadsUntilFailure--;String id=UUID.randomUUID().toString();content.put(id,bytes.clone());names.put(id,name);return new JSONObject().put("id",id).put("name",name);}
    }
    private void images(Device c,String id)throws Exception {
        images(c,id,Color.rgb(123,167,178));
    }
    private void images(Device c,String id,int color)throws Exception {
        File dir=new File(c.getFilesDir(),"media");dir.mkdirs();Bitmap b=Bitmap.createBitmap(160,200,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(b);Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);p.setColor(color);Path shirt=new Path();shirt.moveTo(50,25);shirt.lineTo(10,65);shirt.lineTo(30,92);shirt.lineTo(50,75);shirt.lineTo(50,175);shirt.lineTo(110,175);shirt.lineTo(110,75);shirt.lineTo(130,92);shirt.lineTo(150,65);shirt.lineTo(110,25);shirt.cubicTo(90,45,70,45,50,25);shirt.close();canvas.drawPath(shirt,p);
        for(String suffix:new String[]{".jpg",".png","_full.png"})try(FileOutputStream out=new FileOutputStream(new File(dir,id+suffix))){b.compress(suffix.equals(".jpg")?Bitmap.CompressFormat.JPEG:Bitmap.CompressFormat.PNG,94,out);}b.recycle();
    }
    int run(Instrumentation runner)throws Exception {
        Context root=runner.getTargetContext();String unique=UUID.randomUUID().toString();File temp=new File(root.getCacheDir(),"sync-check-"+unique);Device a=new Device(root,new File(temp,"a"),unique+"-a"),b=new Device(root,new File(temp,"b"),unique+"-b"),c=new Device(root,new File(temp,"c"),unique+"-c");
        String dbA="sync-a-"+unique+".db",dbB="sync-b-"+unique+".db",dbC="sync-c-"+unique+".db";MainActivity.DB da=new MainActivity.DB(a,dbA),db=new MainActivity.DB(b,dbB),dc=new MainActivity.DB(c,dbC);Cloud cloud=new Cloud();String folder="TestFolderForOmoide12345";
        try{
            String id=UUID.randomUUID().toString();JSONObject seed=new JSONObject().put("id",id).put("name","青いシャツ").put("category","シャツ").put("child","長女").put("size","100").put("period","3歳の春").put("note","思い出").put("created",123456789L).put("favorite",false).put("revision",1);
            da.putRaw(SyncMerge.cloneObject(seed));db.putRaw(SyncMerge.cloneObject(seed));images(a,id);images(b,id);a.getSharedPreferences("closet",0).edit().putString("deviceName","パパのスマホ").commit();b.getSharedPreferences("closet",0).edit().putString("deviceName","ママのスマホ").commit();
            JSONObject initial=new DriveSync(a,da).run(cloud,folder,m->{});check(initial.getInt("uploaded")>=3,"First device must upload photos and immutable revision");
            new DriveSync(b,db).run(cloud,folder,m->{});check(SyncMerge.revision(da.get(id)).equals(SyncMerge.revision(db.get(id))),"Legacy backup records must converge to the same baseline");
            JSONObject editedA=da.get(id);editedA.put("note","パパが覚えている入園式");da.put(editedA);
            JSONObject editedB=db.get(id);editedB.put("name","ママが選んだ青いシャツ");db.put(editedB);
            new DriveSync(a,da).run(cloud,folder,m->{});JSONObject conflict=new DriveSync(b,db).run(cloud,folder,m->{});check(conflict.getInt("conflicts")==1,"Concurrent changes must preserve the second version");check(db.all().length()==2,"Conflict must create exactly one additional record");
            new DriveSync(a,da).run(cloud,folder,m->{});check(da.all().length()==2,"Second device must receive the same conflict copy");check(SyncMerge.canonical(da.all()).equals(SyncMerge.canonical(db.all())),"Devices must converge including copy IDs and ancestry");
            boolean noteKept=false,nameKept=false;JSONArray both=da.all();String copyId="";for(int i=0;i<both.length();i++){JSONObject item=both.getJSONObject(i);noteKept|=item.optString("note").contains("パパ");nameKept|=item.optString("name").contains("ママ");if(!item.getString("id").equals(id))copyId=item.getString("id");}check(noteKept&&nameKept,"Neither parent's changes may be lost");
            JSONObject repeat=new DriveSync(b,db).run(cloud,folder,m->{});check(repeat.getInt("conflicts")==0&&db.all().length()==2,"Repeated sync may not multiply conflict copies");check(repeat.getInt("uploaded")==0,"Unchanged sync may not upload duplicate history or images");
            JSONObject archived=da.get(copyId);archived.put("archived",true);da.put(archived);new DriveSync(a,da).run(cloud,folder,m->{});new DriveSync(b,db).run(cloud,folder,m->{});check(db.get(copyId).optBoolean("archived"),"Trash state must sync as a normal revision");
            archived=db.get(copyId);archived.put("archived",false);archived.put("favorite",true);db.put(archived);new DriveSync(b,db).run(cloud,folder,m->{});new DriveSync(a,da).run(cloud,folder,m->{});check(!da.get(copyId).optBoolean("archived")&&da.get(copyId).optBoolean("favorite"),"Restore and favorite must sync");
            JSONObject offline=da.get(id);offline.put("color","青と白");da.put(offline);cloud.fail=true;boolean failed=false;try{new DriveSync(a,da).run(cloud,folder,m->{});}catch(IOException expected){failed=true;}check(failed&&da.get(id).getString("color").equals("青と白"),"Offline errors may not discard saved changes");cloud.fail=false;new DriveSync(a,da).run(cloud,folder,m->{});new DriveSync(b,db).run(cloud,folder,m->{});check(db.get(id).getString("color").equals("青と白"),"Retry must transfer the offline change");
            String beforePhoto=SyncMerge.revision(db.get(id));images(a,id,Color.rgb(205,149,142));JSONObject photoEdit=da.get(id);photoEdit.put("revision",2);photoEdit.put("segmentation","manual");da.put(photoEdit);String afterPhoto=SyncMerge.revision(da.get(id));cloud.uploadsUntilFailure=1;failed=false;
            try{new DriveSync(a,da).run(cloud,folder,m->{});}catch(IOException expected){failed=true;}
            check(failed&&SyncMerge.revision(da.get(id)).equals(afterPhoto),"Partial photo upload must preserve the local edit");
            new DriveSync(b,db).run(cloud,folder,m->{});check(SyncMerge.revision(db.get(id)).equals(beforePhoto),"Incomplete photo upload must not advance another device's record");
            cloud.uploadsUntilFailure=-1;new DriveSync(a,da).run(cloud,folder,m->{});new DriveSync(b,db).run(cloud,folder,m->{});
            check(SyncMerge.revision(db.get(id)).equals(afterPhoto)&&SyncStore.assets(a,da.get(id),true).getString("display").equals(SyncStore.assets(b,db.get(id),true).getString("display")),"Retry must transfer the new photo pixels and revision together");
            JSONObject fresh=new DriveSync(c,dc).run(cloud,folder,m->{});check(fresh.getInt("added")==2&&dc.all().length()==2,"A fresh device must download all merged records");check(AmbientStore.imageFile(c,dc.get(id)).isFile(),"Downloaded records must include display photographs");
            // Ensure exported HTML never exposes credentials and cannot close its data script.
            JSONObject htmlItem=dc.get(id);htmlItem.put("note","<script>window.exportAttack=true</script> & 大切な日");dc.put(htmlItem);c.getSharedPreferences("closet",0).edit().putString("key","SECRET_KEY_NOT_FOR_EXPORT").putString("driveAccount","private-account@example.test").commit();
            File album=new File(root.getCacheDir(),"portable-check.html");try(OutputStream out=new FileOutputStream(album)){PortableAlbum.write(c,out,dc.all());}String html=new String(SyncStore.read(album,20*1024*1024),StandardCharsets.UTF_8);check(html.contains("data:image/png;base64,")&&html.contains("window.PortableAlbum=JSON.parse"),"Viewer must embed photos and UI in one file");check(!html.contains("SECRET_KEY_NOT_FOR_EXPORT")&&!html.contains("private-account@example.test"),"Viewer must exclude credentials and connected account");check(html.contains("\\u003cscript\\u003e")&&!html.contains("<script>window.exportAttack"),"Exported memories must escape script delimiters");
            return checks;
        }finally{da.close();db.close();dc.close();root.deleteDatabase(dbA);root.deleteDatabase(dbB);root.deleteDatabase(dbC);a.getSharedPreferences("closet",0).edit().clear().commit();b.getSharedPreferences("closet",0).edit().clear().commit();c.getSharedPreferences("closet",0).edit().clear().commit();remove(temp);}
    }
    private void remove(File file){File[] children=file.listFiles();if(children!=null)for(File child:children)remove(child);file.delete();}
}
