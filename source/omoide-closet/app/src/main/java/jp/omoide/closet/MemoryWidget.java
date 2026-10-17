package jp.omoide.closet;

import android.app.PendingIntent;
import android.appwidget.*;
import android.content.*;
import android.graphics.*;
import android.os.Bundle;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.util.*;
import java.util.concurrent.*;

/** The launcher flips up to three local photos; no timers wake the app for each slide. */
public class MemoryWidget extends AppWidgetProvider {
    private static final String SHUFFLE="jp.omoide.closet.WIDGET_SHUFFLE";
    private static final ExecutorService loader=Executors.newSingleThreadExecutor();
    @Override public void onReceive(Context c,Intent intent){
        String action=intent.getAction();
        if(AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action)||SHUFFLE.equals(action)||AppWidgetManager.ACTION_APPWIDGET_OPTIONS_CHANGED.equals(action)){
            PendingResult result=goAsync();Context context=c.getApplicationContext();int widgetId=intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,-1);
            int[] requested=intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS);
            loader.execute(()->{try{AppWidgetManager manager=AppWidgetManager.getInstance(context);int[] ids=widgetId!=-1?new int[]{widgetId}:requested!=null?requested:manager.getAppWidgetIds(new ComponentName(context,MemoryWidget.class));update(context,manager,ids);}finally{result.finish();}});
        }else super.onReceive(c,intent);
    }
    static void updateAll(Context c){Context context=c.getApplicationContext();loader.execute(()->{AppWidgetManager manager=AppWidgetManager.getInstance(context);int[] ids=manager.getAppWidgetIds(new ComponentName(context,MemoryWidget.class));if(ids.length>0)update(context,manager,ids);});}
    private static void update(Context c,AppWidgetManager manager,int[] ids){
        if(ids.length==0)return;
        List<JSONObject> items;try{items=AmbientStore.items(c);}catch(Exception e){items=Collections.emptyList();}
        for(int id:ids){try{List<JSONObject> order=new ArrayList<>(items);Collections.shuffle(order);manager.updateAppWidget(id,build(c,id,order));}catch(Exception ignored){/* Keep the last valid view if this launcher rejects an update. */}}
    }
    static RemoteViews build(Context c,int id,List<JSONObject> items){
        RemoteViews outer=new RemoteViews(c.getPackageName(),R.layout.memory_widget);
        outer.removeAllViews(R.id.widget_flipper);
        outer.setInt(R.id.widget_flipper,"setFlipInterval",c.getSharedPreferences("closet",Context.MODE_PRIVATE).getInt("widgetSeconds",30)*1000);
        outer.setViewVisibility(R.id.widget_empty,items.isEmpty()?android.view.View.VISIBLE:android.view.View.GONE);
        outer.setTextViewText(R.id.widget_empty,AmbientStore.emptyLabel(c));
        PendingIntent open=PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        outer.setOnClickPendingIntent(R.id.widget_root,open);
        Intent shuffle=new Intent(c,MemoryWidget.class).setAction(SHUFFLE).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,id).setData(android.net.Uri.parse("omoide://widget/"+id)).addFlags(Intent.FLAG_RECEIVER_FOREGROUND);
        outer.setOnClickPendingIntent(R.id.widget_shuffle,PendingIntent.getBroadcast(c,id,shuffle,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE));
        for(int i=0;i<Math.min(3,items.size());i++){
            JSONObject item=items.get(i);Bitmap original=AmbientStore.bitmap(c,item,400);if(original==null)continue;
            Bitmap thumbnail=Bitmap.createBitmap(256,280,Bitmap.Config.ARGB_8888);MemoryRenderer.draw(new Canvas(thumbnail),item,original,new RectF(3,3,253,277),false);original.recycle();
            RemoteViews slide=new RemoteViews(c.getPackageName(),R.layout.widget_slide);slide.setImageViewBitmap(R.id.widget_photo,thumbnail);slide.setTextViewText(R.id.widget_name,item.optString("name"));slide.setTextViewText(R.id.widget_period,item.optString("period"));slide.setOnClickPendingIntent(R.id.widget_slide,open);outer.addView(R.id.widget_flipper,slide);
        }
        return outer;
    }
}
