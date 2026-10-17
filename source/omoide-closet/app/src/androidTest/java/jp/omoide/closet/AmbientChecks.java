package jp.omoide.closet;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.*;
import android.os.Bundle;
import android.view.*;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.lang.reflect.Field;
import java.util.*;

/** Exercised by: am instrument -w -e ambient true .../SmokeInstrumentation. */
final class AmbientChecks {
    private int count=0;
    private void check(boolean value,String message){if(!value)throw new AssertionError(message);count++;}
    private boolean has(List<JSONObject> items,String id){for(JSONObject x:items)if(x.optString("id").equals(id))return true;return false;}
    int run(Instrumentation runner)throws Exception {
        Context c=runner.getTargetContext();MainActivity.DB db=new MainActivity.DB(c);List<JSONObject> seeded=new ArrayList<>();
        SharedPreferences prefs=c.getSharedPreferences("closet",Context.MODE_PRIVATE);String priorFilter=prefs.getString("ambientFilter","all");int priorInterval=prefs.getInt("widgetSeconds",30),priorDream=prefs.getInt("dreamSeconds",20);
        Activity preview=null;
        try {
            String[] cats={"シャツ","ヘアアクセサリー","ぬいぐるみ"};
            for(int i=0;i<3;i++){
                JSONObject item=new JSONObject().put("id",UUID.randomUUID().toString()).put("name",new String[]{"検証用の青いシャツ","検証用のリボン","検証用のくま"}[i]).put("category",cats[i]).put("period","テスト用の写真").put("favorite",i!=1).put("created",System.currentTimeMillis()+i);
                // These legacy rows intentionally omit the new classification fields.
                db.put(item);seeded.add(item);
                File image=AmbientStore.imageFile(c,item);image.getParentFile().mkdirs();Bitmap b=Bitmap.createBitmap(160,200,Bitmap.Config.ARGB_8888);Canvas cv=new Canvas(b);Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);p.setColor(i==0?Color.rgb(123,167,178):i==1?Color.rgb(198,143,150):Color.rgb(193,151,104));cv.drawRoundRect(new RectF(30,20,130,180),20,20,p);try(FileOutputStream out=new FileOutputStream(image)){b.compress(Bitmap.CompressFormat.PNG,100,out);}b.recycle();
            }
            JSONObject legacy=db.get(seeded.get(0).getString("id"));check(legacy.getString("kind").equals("clothes")&&legacy.getString("wardrobeRole").equals("top"),"Existing shirts must infer top without schema migration");
            JSONObject bottom=new JSONObject().put("category","スカート");check(ItemTypes.role(bottom).equals("bottom"),"Existing skirt must infer bottom");
            check(ItemTypes.role(new JSONObject().put("category","ワンピース")).equals("onepiece"),"One-piece must keep its own role");
            check(ItemTypes.kind(db.get(seeded.get(1).getString("id"))).equals("accessory"),"Accessory category must infer its group");
            check(ItemTypes.kind(db.get(seeded.get(2).getString("id"))).equals("toy"),"Toy category must infer its group");
            JSONObject override=new JSONObject().put("category","シャツ").put("kind","accessory").put("wardrobeRole","top");check(ItemTypes.normalize(override).getString("wardrobeRole").equals("none"),"Non-clothes may never occupy a clothing row");
            prefs.edit().putString("ambientFilter","all").putInt("widgetSeconds",60).putInt("dreamSeconds",10).commit();
            List<JSONObject> all=AmbientStore.items(c);check(has(all,seeded.get(1).getString("id")),"All-items display must include accessories");
            prefs.edit().putString("ambientFilter","favorites").commit();List<JSONObject> fav=AmbientStore.items(c);check(has(fav,seeded.get(0).getString("id"))&&!has(fav,seeded.get(1).getString("id")),"Ambient favorites filter must exclude non-favorites");
            JSONObject archived=seeded.get(2);archived.put("archived",true);db.put(archived);check(!has(AmbientStore.items(c),archived.getString("id")),"Archived photos must disappear from ambient surfaces");archived.put("archived",false);db.put(archived);prefs.edit().putString("ambientFilter","all").commit();
            preview=runner.startActivitySync(new Intent(c,DreamPreviewActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));runner.waitForIdleSync();
            RemoteViews rv=MemoryWidget.build(c,9001,seeded);Activity activity=preview;View[] inflated={null};
            runner.runOnMainSync(()->{FrameLayout parent=new FrameLayout(activity);inflated[0]=rv.apply(activity,parent);});
            ViewFlipper flipper=inflated[0].findViewById(R.id.widget_flipper);check(flipper.getChildCount()==3,"Widget must inflate three photos through actual RemoteViews");check(flipper.getFlipInterval()==60000,"Widget must apply user interval through remotable method");check(flipper.isAutoStart(),"Widget must automatically flip while attached");check(((TextView)flipper.getChildAt(0).findViewById(R.id.widget_name)).getText().toString().equals(seeded.get(0).getString("name")),"Widget must retain saved item labels");
            runner.runOnMainSync(()->{View widget=inflated[0];widget.measure(View.MeasureSpec.makeMeasureSpec(320,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(360,View.MeasureSpec.EXACTLY));widget.layout(0,0,320,360);Bitmap result=Bitmap.createBitmap(320,360,Bitmap.Config.ARGB_8888);widget.draw(new Canvas(result));try(FileOutputStream out=new FileOutputStream(new File(c.getCacheDir(),"widget-check.png"))){result.compress(Bitmap.CompressFormat.PNG,100,out);}catch(Exception e){throw new RuntimeException(e);}result.recycle();});
            check(new File(c.getCacheDir(),"widget-check.png").length()>1000,"Widget must produce a real bitmap drawing");
            Field slideField=DreamPreviewActivity.class.getDeclaredField("slides");slideField.setAccessible(true);MemorySlideView slides=(MemorySlideView)slideField.get(preview);
            Field listField=MemorySlideView.class.getDeclaredField("items");listField.setAccessible(true);long until=System.currentTimeMillis()+20000;int loaded=0;
            while(System.currentTimeMillis()<until){int[] size={0};runner.runOnMainSync(()->{try{size[0]=((List<?>)listField.get(slides)).size();}catch(Exception e){throw new RuntimeException(e);}});loaded=size[0];if(loaded>0)break;Thread.sleep(200);}
            check(loaded>=3,"Native screen saver must load saved items without WebView");
            runner.runOnMainSync(()->{Bitmap shot=Bitmap.createBitmap(480,800,Bitmap.Config.ARGB_8888);slides.draw(new Canvas(shot));try(FileOutputStream out=new FileOutputStream(new File(c.getCacheDir(),"dream-check.png"))){shot.compress(Bitmap.CompressFormat.PNG,100,out);}catch(Exception e){throw new RuntimeException(e);}shot.recycle();});check(new File(c.getCacheDir(),"dream-check.png").length()>1000,"Screen saver must draw saved photos");
            runner.runOnMainSync(slides::stop);check(((List<?>)listField.get(slides)).isEmpty(),"Stopped screen saver must release its photo list");runner.runOnMainSync(slides::start);
            ServiceInfo service=c.getPackageManager().getServiceInfo(new ComponentName(c,ClosetDreamService.class),0);check(service.exported&&"android.permission.BIND_DREAM_SERVICE".equals(service.permission),"Dream service must be available and system-protected");
            ActivityInfo receiver=c.getPackageManager().getReceiverInfo(new ComponentName(c,MemoryWidget.class),PackageManager.GET_META_DATA);check(receiver.metaData.containsKey("android.appwidget.provider"),"Widget provider metadata must be declared");

        }finally{
            if(preview!=null){Activity finished=preview;runner.runOnMainSync(finished::finish);}
            for(JSONObject item:seeded){db.getWritableDatabase().delete("garments","id=?",new String[]{item.optString("id")});AmbientStore.imageFile(c,item).delete();}
            db.close();prefs.edit().putString("ambientFilter",priorFilter).putInt("widgetSeconds",priorInterval).putInt("dreamSeconds",priorDream).commit();
        }
        return count;
    }
}
