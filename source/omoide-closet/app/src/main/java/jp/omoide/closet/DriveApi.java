package jp.omoide.closet;

import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** All API access is restricted by callers to the selected folder and its app files. */
class DriveApi {
    static final class AuthExpired extends IOException {AuthExpired(){super("Googleへの接続期限が切れました。もう一度同期してください。");}}
    private final String token;
    DriveApi(String token){this.token=token;}
    static String enc(String s)throws Exception{return URLEncoder.encode(s,"UTF-8");}
    private byte[] request(String method,String url,byte[] body,String type,int limit)throws Exception {
        HttpURLConnection c=(HttpURLConnection)new URL(url).openConnection();c.setInstanceFollowRedirects(false);c.setConnectTimeout(20000);c.setReadTimeout(60000);c.setRequestMethod(method);c.setRequestProperty("Authorization","Bearer "+token);
        if(body!=null){c.setDoOutput(true);c.setRequestProperty("Content-Type",type);c.setFixedLengthStreamingMode(body.length);}
        try{if(body!=null)try(OutputStream out=c.getOutputStream()){out.write(body);}int status=c.getResponseCode();if(status<200||status>=300){if(status==401)throw new AuthExpired();if(status==403)throw new IOException("このフォルダへの書き込み権限、Google Drive APIの有効化、空き容量を確認してください。");if(status==404)throw new IOException("同期フォルダまたは写真が見つかりません。フォルダの共有設定を確認してください。");if(status==429||status>=500)throw new IOException("Google Driveが混み合っています。しばらくしてから同期してください。");throw new IOException("Google Driveとの通信に失敗しました（"+status+"）。");}
            try(InputStream in=c.getInputStream()){ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[16384];int n,total=0;while((n=in.read(buf))!=-1){total+=n;if(total>limit)throw new IOException("同期ファイルが大きすぎます");out.write(buf,0,n);}return out.toByteArray();}
        }finally{c.disconnect();}
    }
    private JSONObject json(String method,String path,JSONObject body)throws Exception{return new JSONObject(new String(request(method,"https://www.googleapis.com/drive/v3/"+path,body==null?null:body.toString().getBytes(StandardCharsets.UTF_8),"application/json; charset=UTF-8",12*1024*1024),StandardCharsets.UTF_8));}
    JSONObject folder(String id)throws Exception {JSONObject o=json("GET","files/"+enc(id)+"?fields=id,name,mimeType,trashed,capabilities(canAddChildren)",null);if(o.optBoolean("trashed")||!o.optString("mimeType").equals("application/vnd.google-apps.folder")||(o.optJSONObject("capabilities")==null||!o.optJSONObject("capabilities").optBoolean("canAddChildren")))throw new IOException("編集できるGoogle Driveフォルダを選んでください");return o;}
    JSONObject account()throws Exception{return json("GET","about?fields=user(emailAddress,displayName)",null).getJSONObject("user");}
    JSONObject createFolder(String name)throws Exception{return json("POST","files?fields=id,name",new JSONObject().put("name",name).put("mimeType","application/vnd.google-apps.folder"));}
    List<JSONObject> list(String folder)throws Exception {
        if(!folder.matches("[A-Za-z0-9_-]{10,200}"))throw new IOException("フォルダIDを確認してください");List<JSONObject> result=new ArrayList<>();String page="";
        do{JSONObject response=json("GET","files?q="+enc("'"+folder+"' in parents and trashed = false")+"&pageSize=1000&fields=nextPageToken,files(id,name,size,mimeType)"+(page.isEmpty()?"":"&pageToken="+enc(page)),null);JSONArray files=response.getJSONArray("files");for(int i=0;i<files.length();i++)result.add(files.getJSONObject(i));page=response.optString("nextPageToken");if(result.size()>30000)throw new IOException("同期フォルダのファイル数が多すぎます");}while(!page.isEmpty());return result;
    }
    byte[] download(String id,int limit)throws Exception{return request("GET","https://www.googleapis.com/drive/v3/files/"+enc(id)+"?alt=media",null,null,limit);}
    JSONObject upload(String folder,String name,String mime,byte[] bytes)throws Exception {
        String boundary="omoide_"+UUID.randomUUID();ByteArrayOutputStream body=new ByteArrayOutputStream();
        body.write(("--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n"+new JSONObject().put("name",name).put("parents",new JSONArray().put(folder))+"\r\n--"+boundary+"\r\nContent-Type: "+mime+"\r\n\r\n").getBytes(StandardCharsets.UTF_8));body.write(bytes);body.write(("\r\n--"+boundary+"--\r\n").getBytes(StandardCharsets.UTF_8));
        return new JSONObject(new String(request("POST","https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size",body.toByteArray(),"multipart/related; boundary="+boundary,2*1024*1024),StandardCharsets.UTF_8));
    }
}
