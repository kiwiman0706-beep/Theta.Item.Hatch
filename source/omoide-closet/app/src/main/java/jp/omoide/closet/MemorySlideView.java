package jp.omoide.closet;

import android.content.Context;
import android.graphics.*;
import android.os.SystemClock;
import android.view.View;
import org.json.JSONObject;
import java.util.*;
import java.util.concurrent.*;

final class MemorySlideView extends View {
    private final ExecutorService loader=Executors.newSingleThreadExecutor();
    private List<JSONObject> items=Collections.emptyList();
    private Bitmap current,next;private int index=0;private long started;private boolean running=false;private int generation=0;
    private final int seconds;private final Paint text=new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Runnable frame=()->{if(running){invalidate();postDelayed(this.frame,42);}};
    MemorySlideView(Context c){super(c);seconds=c.getSharedPreferences("closet",Context.MODE_PRIVATE).getInt("dreamSeconds",20);setBackgroundColor(Color.rgb(26,24,23));setContentDescription("おもいでクローゼットのスクリーンセーバー");}
    void start(){if(running||loader.isShutdown())return;running=true;index=0;int g=++generation;started=SystemClock.uptimeMillis();
        loader.execute(()->{List<JSONObject> found;try{found=AmbientStore.items(getContext());Collections.shuffle(found);}catch(Exception e){found=Collections.emptyList();}
            Bitmap first=found.isEmpty()?null:AmbientStore.bitmap(getContext(),found.get(0),800);Bitmap second=found.size()<2?null:AmbientStore.bitmap(getContext(),found.get(1),800);List<JSONObject> result=found;
            post(()->{if(!running||generation!=g){recycle(first);recycle(second);return;}items=result;current=first;next=second;started=SystemClock.uptimeMillis();invalidate();});
        });removeCallbacks(frame);post(frame);
    }
    void stop(){running=false;generation++;removeCallbacks(frame);recycle(current);recycle(next);current=null;next=null;items=Collections.emptyList();}
    void dispose(){stop();loader.shutdownNow();}
    private static void recycle(Bitmap b){if(b!=null&&!b.isRecycled())b.recycle();}
    @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);float w=getWidth(),h=getHeight();if(w<1||h<1)return;
        long elapsed=SystemClock.uptimeMillis()-started;float cycle=Math.max(10000,seconds*1000),progress=Math.min(1,elapsed/cycle);
        // A small moving cabinet and drifting text avoid a permanently fixed photo.
        float sway=(float)Math.sin(SystemClock.uptimeMillis()/37000.0)*w*.018f;
        text.setColor(Color.rgb(168,147,128));text.setTextAlign(Paint.Align.CENTER);text.setTextSize(Math.max(14,w*.035f));
        canvas.drawText("おもいでクローゼット",w/2+sway,h*.12f,text);
        if(items.isEmpty()){text.setTextSize(Math.max(13,w*.029f));canvas.drawText(AmbientStore.emptyLabel(getContext()),w/2,h/2,text);return;}
        float cw=Math.min(w*.79f,h*.57f),ch=Math.min(h*.56f,cw*1.3f),cx=w/2+sway,y=(h-ch)/2;
        JSONObject item=items.get(index);float translation=(.5f-progress)*w*.10f;
        int alpha=(int)(255*Math.min(1,Math.min(elapsed/750f,(cycle-elapsed)/750f)));
        canvas.saveLayerAlpha(0,0,w,h,Math.max(0,alpha));
        MemoryRenderer.draw(canvas,item,current,new RectF(cx-cw/2+translation,y,cx+cw/2+translation,y+ch),true);
        text.setTextSize(Math.max(16,w*.042f));text.setColor(Color.rgb(219,202,183));canvas.drawText(shortText(item.optString("name"),19),cx+translation,y+ch+h*.07f,text);
        text.setTextSize(Math.max(12,w*.029f));text.setColor(Color.rgb(157,139,122));canvas.drawText(shortText(item.optString("period"),26),cx+translation,y+ch+h*.115f,text);canvas.restore();
        if(elapsed>=cycle&&running){started=SystemClock.uptimeMillis();if(items.size()>1){recycle(current);current=next;next=null;index=(index+1)%items.size();JSONObject nextItem=items.get((index+1)%items.size());int g=generation,requestedIndex=index;
            loader.execute(()->{Bitmap loaded=AmbientStore.bitmap(getContext(),nextItem,800);post(()->{if(!running||generation!=g||index!=requestedIndex)recycle(loaded);else{recycle(next);next=loaded;}});});
        }}
    }
    private String shortText(String value,int length){return value.length()>length?value.substring(0,length-1)+"…":value;}
}
