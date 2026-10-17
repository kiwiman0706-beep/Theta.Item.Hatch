package jp.omoide.closet;

import android.graphics.*;
import org.json.JSONObject;

/** Draw the saved photo without generating or changing the item's shape. */
final class MemoryRenderer {
    static void draw(Canvas c,JSONObject item,Bitmap photo,RectF area,boolean dark) {
        float w=area.width(),h=area.height(),cx=area.centerX();
        Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);p.setColor(dark?Color.rgb(57,47,40):Color.rgb(247,235,218));
        c.drawRoundRect(area,w*.04f,w*.04f,p);
        p.setColor(dark?Color.rgb(108,86,66):Color.rgb(212,183,150));p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(w*.025f);c.drawRoundRect(area,w*.04f,w*.04f,p);p.setStyle(Paint.Style.FILL);
        boolean clothes="clothes".equals(ItemTypes.kind(item));
        float top=area.top+h*.06f,bottom=area.bottom-h*.12f;
        if(clothes){
            p.setColor(dark?Color.rgb(148,130,107):Color.rgb(154,124,91));p.setStrokeWidth(w*.008f);c.drawLine(area.left,top,area.right,top,p);
            Path path=new Path();path.moveTo(cx-w*.02f,top+h*.02f);path.cubicTo(cx-w*.02f,top-h*.04f,cx+w*.06f,top-h*.03f,cx+w*.03f,top+h*.03f);path.lineTo(cx,top+h*.06f);
            if(ItemTypes.role(item).equals("bottom")){path.lineTo(cx,top+h*.13f);path.moveTo(cx-w*.25f,top+h*.13f);path.lineTo(cx+w*.25f,top+h*.13f);path.moveTo(cx-w*.21f,top+h*.13f);path.lineTo(cx-w*.21f,top+h*.18f);path.moveTo(cx+w*.21f,top+h*.13f);path.lineTo(cx+w*.21f,top+h*.18f);}
            else{path.lineTo(cx-w*.29f,top+h*.19f);path.lineTo(cx+w*.29f,top+h*.19f);path.lineTo(cx,top+h*.06f);}
            p.setStyle(Paint.Style.STROKE);c.drawPath(path,p);p.setStyle(Paint.Style.FILL);top+=h*.16f;
        }else{
            p.setColor(dark?Color.rgb(108,86,66):Color.rgb(207,177,141));c.drawRoundRect(new RectF(area.left+w*.1f,bottom,area.right-w*.1f,bottom+h*.025f),3,3,p);top+=h*.05f;
        }
        if(photo!=null&&!photo.isRecycled()) {
            float scale=Math.min(w*.78f/photo.getWidth(),(bottom-top)/photo.getHeight());float pw=photo.getWidth()*scale,ph=photo.getHeight()*scale;
            float y=clothes?top:bottom-ph; p.setFilterBitmap(true);c.drawBitmap(photo,null,new RectF(cx-pw/2,y,cx+pw/2,y+ph),p);
        }
    }
}
