package jp.omoide.closet;

import android.content.Context;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

final class SyncStore {
    static String suffix(String kind){return "original".equals(kind)?".jpg":"full".equals(kind)?"_full.png":".png";}
    static boolean person(JSONObject item){return "person".equals(item.optString("entity"));}
    static String imageId(String value)throws IOException{if(!value.matches("[a-f0-9-]{36}"))throw new IOException("写真のIDが不正です");return value;}
    static Map<String,String> paths(JSONObject item)throws Exception {
        Map<String,String> files=new LinkedHashMap<>();
        if(person(item)){String avatar=item.optString("avatarId");if(!avatar.isEmpty())files.put("avatar",imageId(avatar)+".jpg");return files;}
        String id=imageId(item.getString("id"));for(String kind:new String[]{"original","display","full"})files.put(kind,id+suffix(kind));
        JSONObject back=item.optJSONObject("back");if(back!=null){String bid=imageId(back.getString("id"));for(String kind:new String[]{"original","display","full"})files.put("back_"+kind,bid+suffix(kind));}
        JSONArray memories=item.optJSONArray("memories");if(memories!=null){if(memories.length()>50)throw new IOException("関連写真は1点につき50枚までです");for(int i=0;i<memories.length();i++){String pid=imageId(memories.getJSONObject(i).getString("id"));if(files.put("memory_"+pid,pid+".jpg")!=null)throw new IOException("関連写真のIDが重複しています");}}
        return files;
    }
    static boolean jpeg(String kind){return kind.endsWith("original")||kind.startsWith("memory_")||kind.equals("avatar");}
    static byte[] read(File file,int limit)throws Exception{try(InputStream in=new FileInputStream(file)){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[16384];int n,total=0;while((n=in.read(b))!=-1){total+=n;if(total>limit)throw new IOException("写真または記録が大きすぎます");out.write(b,0,n);}return out.toByteArray();}}
    static JSONObject assets(Context c,JSONObject item,boolean required)throws Exception {
        JSONObject assets=new JSONObject();for(Map.Entry<String,String> entry:paths(item).entrySet()){File f=new File(new File(c.getFilesDir(),"media"),entry.getValue());if(f.isFile())assets.put(entry.getKey(),SyncMerge.sha(read(f,12*1024*1024)));else if(required)throw new IOException("写真が不足しています。バックアップや元の端末で写真を確認してください。");}return assets;
    }
    static void atomic(File file,byte[] bytes)throws Exception{file.getParentFile().mkdirs();File temp=new File(file.getPath()+".tmp");try(FileOutputStream out=new FileOutputStream(temp)){out.write(bytes);out.getFD().sync();}if(!temp.renameTo(file))throw new IOException("同期データを保存できませんでした");}
}
