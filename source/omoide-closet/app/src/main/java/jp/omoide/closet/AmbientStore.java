package jp.omoide.closet;

import android.content.Context;
import android.graphics.*;
import org.json.*;
import java.io.File;
import java.util.*;

final class AmbientStore {
    static List<JSONObject> items(Context context)throws Exception {
        List<JSONObject> result=new ArrayList<>();
        boolean favorites=context.getSharedPreferences("closet",Context.MODE_PRIVATE).getString("ambientFilter","all").equals("favorites");
        try(MainActivity.DB db=new MainActivity.DB(context)) {
            JSONArray all=db.all();
            for(int i=0;i<all.length();i++) {
                JSONObject item=all.getJSONObject(i);
                if(!item.optBoolean("archived")&&(!favorites||item.optBoolean("favorite"))&&imageFile(context,item).isFile())result.add(item);
            }
        }
        return result;
    }
    static File imageFile(Context context,JSONObject item) {
        String id=item.optString("id");
        // Never allow restored metadata to escape private media storage.
        if(!id.matches("[a-f0-9-]{36}"))return new File(context.getFilesDir(),"missing");
        return new File(new File(context.getFilesDir(),"media"),id+".png");
    }
    static Bitmap bitmap(Context context,JSONObject item,int max) {
        String path=imageFile(context,item).getAbsolutePath();
        BitmapFactory.Options o=new BitmapFactory.Options();o.inJustDecodeBounds=true;BitmapFactory.decodeFile(path,o);
        if(o.outWidth<1||o.outHeight<1)return null;
        o.inSampleSize=1;while(Math.max(o.outWidth,o.outHeight)/o.inSampleSize>max*2)o.inSampleSize*=2;
        o.inJustDecodeBounds=false;Bitmap b=BitmapFactory.decodeFile(path,o);if(b==null)return null;
        int size=Math.max(b.getWidth(),b.getHeight());if(size>max){Bitmap small=Bitmap.createScaledBitmap(b,Math.max(1,b.getWidth()*max/size),Math.max(1,b.getHeight()*max/size),true);if(small!=b)b.recycle();b=small;}return b;
    }
    static String emptyLabel(Context c) {return c.getSharedPreferences("closet",Context.MODE_PRIVATE).getString("ambientFilter","all").equals("favorites")?"お気に入りの宝物を登録してください":"写真を残すと、ここに思い出が並びます";}
}
