package jp.omoide.closet;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import org.json.*;
import java.io.*;
import java.lang.reflect.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.zip.*;

/** Device-level tests of pixels, persistence, backup, and the actual WebView. No cloud requests. */
public class SmokeInstrumentation extends Instrumentation {
    private int checks=0;
    private boolean ambientOnly=false;
    private boolean syncOnly=false;
    private boolean dataOnly=false;
    private boolean familyOnly=false;
    @Override public void onCreate(Bundle args){super.onCreate(args);ambientOnly=args!=null&&"true".equals(args.getString("ambient"));syncOnly=args!=null&&"true".equals(args.getString("sync"));dataOnly=args!=null&&"true".equals(args.getString("data"));familyOnly=args!=null&&"true".equals(args.getString("family"));start();}
    private void check(boolean b,String message){if(!b)throw new AssertionError(message);checks++;}
    private Object call(MainActivity a,String name,Class<?> type,Object p)throws Exception {
        Method m=MainActivity.class.getDeclaredMethod(name,type);m.setAccessible(true);return m.invoke(a,p);
    }
    private JSONObject boot(MainActivity a)throws Exception{Method m=MainActivity.class.getDeclaredMethod("bootstrap");m.setAccessible(true);return (JSONObject)m.invoke(a);}
    private String js(MainActivity a,String code)throws Exception{
        Field f=MainActivity.class.getDeclaredField("web");f.setAccessible(true);WebView w=(WebView)f.get(a);
        CountDownLatch latch=new CountDownLatch(1);String[] out={""};runOnMainSync(()->w.evaluateJavascript(code,r->{out[0]=r;latch.countDown();}));
        if(!latch.await(20,TimeUnit.SECONDS))throw new IOException("WebView callback timeout");return out[0];
    }
    @Override public void onStart(){Bundle result=new Bundle();try{
        if(familyOnly){int passed=new FamilyChecks().run(this);result.putString("stream","PASS: "+passed+" family/media checks: migration, multiple owners, reciprocal sets, front-only, back cutout isolation, avatars, captions, v1/v2 backup, HTML and media sync.\n");finish(Activity.RESULT_OK,result);return;}
        if(syncOnly){int passed=new SyncChecks().run(this);result.putString("stream","PASS: "+passed+" sync/export checks: two devices, concurrent edits, convergence, duplicate prevention, trash, restore, favorite, offline retry, fresh download, embedded HTML, privacy and escaping.\n");finish(Activity.RESULT_OK,result);return;}
        if(ambientOnly){int passed=new AmbientChecks().run(this);result.putString("stream","PASS: "+passed+" native ambient checks: legacy records, grouping, filters, actual RemoteViews inflation, interval, drawing, screen saver lifecycle, manifest wiring.\n");finish(Activity.RESULT_OK,result);return;}
        MainActivity a=(MainActivity)startActivitySync(new Intent(getTargetContext(),MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
        Bitmap image=Bitmap.createBitmap(600,800,Bitmap.Config.ARGB_8888);Canvas c=new Canvas(image);c.drawColor(Color.rgb(235,228,214));Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);paint.setColor(Color.rgb(145,171,197));
        Path shirt=new Path();shirt.moveTo(205,110);shirt.lineTo(90,195);shirt.lineTo(145,285);shirt.lineTo(205,245);shirt.lineTo(205,650);shirt.lineTo(395,650);shirt.lineTo(395,245);shirt.lineTo(455,285);shirt.lineTo(510,195);shirt.lineTo(395,110);shirt.cubicTo(350,160,250,160,205,110);shirt.close();c.drawPath(shirt,paint);
        File source=new File(a.getCacheDir(),"device-test-shirt.png");try(FileOutputStream o=new FileOutputStream(source)){image.compress(Bitmap.CompressFormat.PNG,100,o);}
        JSONObject draft=(JSONObject)call(a,"ingest",Uri.class,Uri.fromFile(source));String id=draft.getString("id");
        check(boot(a).getJSONObject("draft").getString("id").equals(id),"Capture draft must persist");
        Bitmap cut=Bitmap.createBitmap(600,800,Bitmap.Config.ARGB_8888);new Canvas(cut).drawPath(shirt,paint);ByteArrayOutputStream png=new ByteArrayOutputStream();cut.compress(Bitmap.CompressFormat.PNG,100,png);
        JSONObject savedCut=(JSONObject)call(a,"saveCutout",JSONObject.class,new JSONObject().put("id",id).put("png","data:image/png;base64,"+android.util.Base64.encodeToString(png.toByteArray(),android.util.Base64.NO_WRAP)));
        check(savedCut.getString("segmentation").equals("manual"),"Manual cutout should save");
        File display=new File(a.getFilesDir(),"media/"+id+".png");Bitmap trimmed=BitmapFactory.decodeFile(display.getAbsolutePath());check(trimmed.getWidth()<600&&trimmed.getHeight()<800,"Display image must trim alpha padding");
        JSONObject item=(JSONObject)call(a,"save",JSONObject.class,new JSONObject().put("id",id).put("name","入園式の青いシャツ").put("category","シャツ").put("child","長女").put("size","100").put("period","3歳の春").put("note","たくさん笑った日。 <思い出>").put("favorite",true));
        check(boot(a).isNull("draft"),"Saving must clear draft");
        MainActivity.DB reopened=new MainActivity.DB(a);check(reopened.get(id).getString("note").contains("<思い出>"),"SQLite record must survive reopening");reopened.close();
        call(a,"saveSettings",JSONObject.class,new JSONObject().put("apiKey","TEST_ONLY_NOT_A_REAL_GEMINI_KEY"));
        Method key=MainActivity.class.getDeclaredMethod("apiKey");key.setAccessible(true);check("TEST_ONLY_NOT_A_REAL_GEMINI_KEY".equals(key.invoke(a)),"AndroidKeyStore encryption round trip");
        File zip=new File(a.getCacheDir(),"device-test-backup.zip");call(a,"backup",Uri.class,Uri.fromFile(zip));
        String manifest="";Set<String> files=new HashSet<>();try(ZipInputStream zin=new ZipInputStream(new FileInputStream(zip))){ZipEntry z;while((z=zin.getNextEntry())!=null){files.add(z.getName());if(z.getName().equals("manifest.json")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] bytes=new byte[8192];int n;while((n=zin.read(bytes))!=-1)out.write(bytes,0,n);manifest=out.toString("UTF-8");
        }}}
        check(files.size()==6,"Backup must include manifest, original, both cutouts, portable HTML and instructions");check(!manifest.contains("TEST_ONLY")&&!manifest.contains("apiKey"),"Backup must not include API key");
        JSONObject duplicate=(JSONObject)call(a,"restoreBackup",Uri.class,Uri.fromFile(zip));check(duplicate.getInt("added")==0&&duplicate.getInt("skipped")==1,"Restore must skip duplicate IDs");
        Field df=MainActivity.class.getDeclaredField("db");df.setAccessible(true);MainActivity.DB db=(MainActivity.DB)df.get(a);db.getWritableDatabase().delete("garments",null,null);
        JSONObject restored=(JSONObject)call(a,"restoreBackup",Uri.class,Uri.fromFile(zip));check(restored.getInt("added")==1,"Restore must recover records and images");
        File invalid=new File(a.getCacheDir(),"bad-backup.zip");try(ZipOutputStream out=new ZipOutputStream(new FileOutputStream(invalid))){out.putNextEntry(new ZipEntry("../outside.txt"));out.write(1);out.closeEntry();}
        boolean rejected=false;try{call(a,"restoreBackup",Uri.class,Uri.fromFile(invalid));}catch(InvocationTargetException e){rejected=e.getCause() instanceof IOException;}
        check(rejected,"Importer must reject path traversal");
        call(a,"saveSettings",JSONObject.class,new JSONObject().put("removeKey",true));
        Bundle intermediate=new Bundle();intermediate.putString("stream","PASS: "+checks+" native data checks (pixels, SQLite, key encryption, backup and restore).\n");sendStatus(0,intermediate);
        if(dataOnly){result.putString("stream","PASS: "+checks+" native data checks (pixels, SQLite, key encryption, ZIP with embedded HTML, backup and restore).\n");finish(Activity.RESULT_OK,result);return;}
        long end=System.currentTimeMillis()+45000;String ready="";
        while(System.currentTimeMillis()<end){ready=js(a,"typeof window.nativeReply");if(ready.contains("function"))break;Thread.sleep(300);}
        check(ready.contains("function"),"WebView must load bundled JavaScript");
        js(a,"window.nativeEvent('refresh', {})");Thread.sleep(1000);
        check(js(a,"document.getElementById('count-number').textContent").contains("1"),"Native bridge must display persisted garment");
        check(js(a,"document.querySelector('.hanging-item img').src").contains(id),"Closet should replace samples with saved photo");
        js(a,"switchTab('album')");check(js(a,"document.querySelectorAll('.album-card').length").equals("1"),"Album must show saved garment");
        js(a,"openDetail(state.items[0])");check(js(a,"document.querySelector('.memory').textContent").contains("思い出"),"Detail must render memory text safely");
        check(js(a,"document.querySelectorAll('.memory 思い出').length").equals("0"),"Memory text must be escaped");
        result.putString("stream","PASS: "+checks+" device checks. Photo pixels, draft, SQLite, key encryption, backup/restore, zip validation, WebView bridge and album.\n");finish(Activity.RESULT_OK,result);
    }catch(Throwable e){StringWriter out=new StringWriter();e.printStackTrace(new PrintWriter(out));result.putString("stream","FAIL after "+checks+" checks\n"+out);finish(Activity.RESULT_CANCELED,result);}}
}
