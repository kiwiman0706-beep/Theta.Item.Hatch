package jp.omoide.closet;

import org.json.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Immutable revisions and ancestry, independent of device clocks. */
final class SyncMerge {
    static JSONObject cloneObject(JSONObject o)throws Exception{return new JSONObject(o.toString());}
    static String canonical(Object value)throws Exception {
        if(value instanceof JSONObject){JSONObject o=(JSONObject)value;List<String> keys=new ArrayList<>();for(Iterator<String> i=o.keys();i.hasNext();)keys.add(i.next());Collections.sort(keys);StringBuilder b=new StringBuilder("{");for(String k:keys){if(b.length()>1)b.append(',');b.append(JSONObject.quote(k)).append(':').append(canonical(o.get(k)));}return b.append('}').toString();}
        if(value instanceof JSONArray){JSONArray a=(JSONArray)value;StringBuilder b=new StringBuilder("[");for(int i=0;i<a.length();i++){if(i>0)b.append(',');b.append(canonical(a.get(i)));}return b.append(']').toString();}
        return value==null||value==JSONObject.NULL?"null":value instanceof String?JSONObject.quote((String)value):String.valueOf(value);
    }
    static String uuid(String value){return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8)).toString();}
    static String sha(byte[] bytes)throws Exception{byte[] digest=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder s=new StringBuilder();for(byte b:digest)s.append(String.format(Locale.US,"%02x",b&255));return s.toString();}
    static JSONObject semantic(JSONObject item)throws Exception{JSONObject o=cloneObject(item);o.remove("_sync");o.remove("updated");return o;}
    static JSONObject baseline(JSONObject item,JSONObject assets)throws Exception {
        JSONObject s=new JSONObject();s.put("revision",uuid("baseline:"+canonical(semantic(item))+canonical(assets)));s.put("ancestors",new JSONArray());s.put("assets",assets);s.put("device","以前の記録");return s;
    }
    static JSONObject touch(JSONObject item,JSONObject previous,JSONObject assets,String device)throws Exception {
        JSONObject result=cloneObject(item);JSONObject prior=previous==null?null:previous.optJSONObject("_sync");
        if(prior==null&&previous!=null)prior=baseline(previous,assets);
        if(prior!=null&&canonical(semantic(item)).equals(canonical(semantic(previous)))&&canonical(assets).equals(canonical(prior.optJSONObject("assets")))){result.put("_sync",prior);return result;}
        JSONObject s=new JSONObject();TreeSet<String> ancestors=new TreeSet<>();if(prior!=null){ancestors.add(prior.getString("revision"));JSONArray old=prior.optJSONArray("ancestors");if(old!=null)for(int i=0;i<old.length();i++)ancestors.add(old.getString(i));}
        s.put("revision",UUID.randomUUID().toString());s.put("ancestors",new JSONArray(ancestors));s.put("assets",assets);s.put("device",device);result.put("_sync",s);result.put("updated",System.currentTimeMillis());return result;
    }
    static String revision(JSONObject o){JSONObject s=o.optJSONObject("_sync");return s==null?"":s.optString("revision");}
    static boolean follows(JSONObject a,JSONObject b){JSONObject s=a.optJSONObject("_sync");JSONArray ancestors=s==null?null:s.optJSONArray("ancestors");String r=revision(b);if(ancestors!=null)for(int i=0;i<ancestors.length();i++)if(r.equals(ancestors.optString(i)))return true;return false;}
    static void validate(JSONObject o)throws Exception {
        if(!o.optString("id").matches("[a-f0-9-]{36}")||!revision(o).matches("[a-f0-9-]{36}"))throw new java.io.IOException("同期記録のIDが不正です");
        JSONObject s=o.getJSONObject("_sync"),assets=s.getJSONObject("assets");
        Set<String> expected=SyncStore.paths(o).keySet();if(assets.length()!=expected.size())throw new java.io.IOException("同期写真の情報が不足しています。すべての端末を最新のアプリに更新してください。");
        for(String kind:expected)if(!assets.optString(kind).matches("[a-f0-9]{64}"))throw new java.io.IOException("同期写真の情報が不足しています");
        for(String field:new String[]{"ownerIds","relatedIds"}){JSONArray ids=o.optJSONArray(field);if(ids!=null){if(ids.length()>100)throw new java.io.IOException("紐付けが多すぎます");Set<String> seen=new HashSet<>();for(int i=0;i<ids.length();i++){String id=ids.getString(i);if(!id.matches("[a-f0-9-]{36}")||!seen.add(id))throw new java.io.IOException("紐付けのIDが不正です");}}}
        JSONArray ancestors=s.optJSONArray("ancestors");if(ancestors==null||ancestors.length()>5000)throw new java.io.IOException("変更履歴が不正です");
        for(int i=0;i<ancestors.length();i++)if(!ancestors.getString(i).matches("[a-f0-9-]{36}")||ancestors.getString(i).equals(revision(o)))throw new java.io.IOException("変更履歴が不正です");
    }
    static final class Result {final JSONArray items;final int conflicts;Result(JSONArray items,int conflicts){this.items=items;this.conflicts=conflicts;}}
    static Result merge(List<JSONObject> local,List<JSONObject> remote)throws Exception {
        TreeMap<String,TreeMap<String,JSONObject>> groups=new TreeMap<>();
        for(List<JSONObject> list:Arrays.asList(remote,local))for(JSONObject item:list){validate(item);TreeMap<String,JSONObject> versions=groups.computeIfAbsent(item.getString("id"),k->new TreeMap<>());JSONObject previous=versions.get(revision(item));if(previous!=null&&!canonical(previous).equals(canonical(item)))throw new java.io.IOException("同じ変更履歴の内容が一致しません");versions.put(revision(item),item);}
        TreeMap<String,JSONObject> merged=new TreeMap<>();int conflicts=0;
        for(Map.Entry<String,TreeMap<String,JSONObject>> group:groups.entrySet()){
            List<JSONObject> heads=new ArrayList<>();for(JSONObject candidate:group.getValue().values()){boolean older=false;for(JSONObject other:group.getValue().values())if(follows(other,candidate)){older=true;break;}if(!older)heads.add(candidate);}
            if(heads.isEmpty())throw new java.io.IOException("変更履歴が循環しています");
            JSONObject primary=cloneObject(heads.get(0));
            if(heads.size()>1){
                JSONObject primaryMeaning=semantic(primary);primaryMeaning.remove("revision");boolean same=true;
                for(int i=1;i<heads.size();i++){JSONObject h=heads.get(i),meaning=semantic(h);meaning.remove("revision");if(!canonical(primaryMeaning).equals(canonical(meaning))||!canonical(primary.getJSONObject("_sync").getJSONObject("assets")).equals(canonical(h.getJSONObject("_sync").getJSONObject("assets"))))same=false;}
                TreeSet<String> history=new TreeSet<>(),headIds=new TreeSet<>();long updated=0;
                for(JSONObject head:heads){headIds.add(revision(head));history.add(revision(head));JSONArray a=head.getJSONObject("_sync").getJSONArray("ancestors");for(int i=0;i<a.length();i++)history.add(a.getString(i));updated=Math.max(updated,head.optLong("updated",head.optLong("created")));}
                JSONObject sync=cloneObject(primary.getJSONObject("_sync"));sync.put("revision",uuid("merge:"+group.getKey()+headIds.toString()));sync.put("ancestors",new JSONArray(history));sync.put("device","統合");primary.put("_sync",sync);primary.put("updated",updated);
                if(!same){for(int i=1;i<heads.size();i++){
                    JSONObject head=heads.get(i),copy=cloneObject(head);String copyId=uuid("conflict:"+group.getKey()+revision(head));
                    copy.put("id",copyId);copy.put("name",head.optString("name","思い出")+"（同時編集の別版）");copy.put("conflictOf",group.getKey());
                    // Back cutouts may be edited on both devices. A fork needs its own path.
                    JSONObject back=copy.optJSONObject("back");if(back!=null)back.put("id",uuid("copy-photo:"+copyId+":back"));
                    JSONObject cs=cloneObject(head.getJSONObject("_sync"));cs.put("revision",uuid("copy:"+copyId));cs.put("ancestors",new JSONArray());copy.put("_sync",cs);
                    if(!groups.containsKey(copyId))merged.put(copyId,copy);conflicts++;
                }}
            }
            merged.put(group.getKey(),primary);
        }
        return new Result(new JSONArray(merged.values()),conflicts);
    }
}
