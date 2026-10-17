package jp.omoide.closet;

import android.content.Context;
import android.util.Base64;
import org.json.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

/** Single-file, offline, read-only version of the same closet UI. */
final class PortableAlbum {
    private static String asset(Context c,String name)throws Exception{try(InputStream in=c.getAssets().open(name)){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);return out.toString("UTF-8");}}
    private static String safeJSON(String text){return text.replace("<","\\u003c").replace(">","\\u003e").replace("&","\\u0026").replace("\u2028","\\u2028").replace("\u2029","\\u2029");}
    static void write(Context c,OutputStream out,JSONArray all)throws Exception {
        write(c,out,all,new JSONArray());
    }
    static void write(Context c,OutputStream out,JSONArray all,JSONArray familyRecords)throws Exception {
        JSONArray items=new JSONArray();JSONArray children=new JSONArray();java.util.Set<String> names=new java.util.LinkedHashSet<>();
        java.util.Map<String,String> photographs=new java.util.LinkedHashMap<>();JSONArray families=new JSONArray();
        for(int i=0;i<all.length();i++){JSONObject item=all.getJSONObject(i);if(item.optBoolean("archived"))continue;JSONObject copy=new JSONObject();for(String key:new String[]{"id","name","category","kind","wardrobeRole","child","children","ownerIds","relatedIds","size","period","note","color","favorite","created"})if(item.has(key))copy.put(key,item.get(key));
            String id=SyncStore.imageId(item.getString("id"));photographs.put(id,id+".png");JSONObject back=item.optJSONObject("back");if(back!=null){String bid=SyncStore.imageId(back.getString("id"));copy.put("back",new JSONObject().put("id",bid));photographs.put(bid,bid+".png");}
            JSONArray memories=item.optJSONArray("memories"),clean=new JSONArray();if(memories!=null)for(int j=0;j<memories.length();j++){JSONObject memory=memories.getJSONObject(j);String pid=SyncStore.imageId(memory.getString("id"));clean.put(new JSONObject().put("id",pid).put("caption",memory.optString("caption")));photographs.put(pid,pid+".jpg");}copy.put("memories",clean);
            items.put(copy);JSONArray owners=item.optJSONArray("children");if(owners!=null)for(int j=0;j<owners.length();j++)names.add(owners.getString(j));else if(!item.optString("child").isEmpty())names.add(item.getString("child"));
        }
        for(int i=0;i<familyRecords.length();i++){JSONObject family=familyRecords.getJSONObject(i);if(family.optBoolean("archived"))continue;JSONObject copy=new JSONObject();for(String key:new String[]{"id","name","aliases","avatarId"})if(family.has(key))copy.put(key,family.get(key));families.put(copy);names.add(family.getString("name"));if(family.has("avatarId")){String aid=SyncStore.imageId(family.getString("avatarId"));photographs.put(aid,aid+".jpg");}}for(String name:names)children.put(name);
        JSONObject settings=new JSONObject().put("families",families).put("children",children).put("autoplay",true).put("speed",24).put("hasKey",false).put("consent",false).put("driveAuto",false);
        String html=asset(c,"index.html").replace("<link rel=\"stylesheet\" href=\"style.css\">","<style>"+asset(c,"style.css")+"</style>");String marker="<script src=\"app.js\"></script>";int at=html.indexOf(marker);if(at<0)throw new IOException("アルバムの画面を読み込めません");
        Writer writer=new OutputStreamWriter(out,StandardCharsets.UTF_8);writer.write(html.substring(0,at));writer.write("<script id=\"portable-data\" type=\"application/json\">{\"items\":");writer.write(safeJSON(items.toString()));writer.write(",\"settings\":");writer.write(safeJSON(settings.toString()));writer.write(",\"exported\":"+System.currentTimeMillis()+",\"media\":{");
        int index=0;for(java.util.Map.Entry<String,String> photograph:photographs.entrySet()){
            byte[] bytes=SyncStore.read(new File(new File(c.getFilesDir(),"media"),photograph.getValue()),12*1024*1024);if(index++>0)writer.write(',');writer.write(JSONObject.quote(photograph.getKey()));writer.write(photograph.getValue().endsWith(".jpg")?":\"data:image/jpeg;base64,":":\"data:image/png;base64,");writer.write(Base64.encodeToString(bytes,Base64.NO_WRAP));writer.write('"');
        }
        writer.write("}}</script><script>window.PortableAlbum=JSON.parse(document.getElementById('portable-data').textContent);</script><script>");writer.write(asset(c,"app.js").replace("</script","<\\/script"));writer.write("</script>");writer.write(html.substring(at+marker.length()));writer.flush();
    }
}
