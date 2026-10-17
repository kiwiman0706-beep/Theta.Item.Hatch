package jp.omoide.closet;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;

public class DreamPreviewActivity extends Activity {
    private MemorySlideView slides;
    @Override public void onCreate(Bundle state){super.onCreate(state);getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);slides=new MemorySlideView(this);slides.setOnClickListener(v->finish());setContentView(slides);}
    @Override protected void onResume(){super.onResume();slides.start();}
    @Override protected void onPause(){slides.stop();super.onPause();}
    @Override protected void onDestroy(){slides.dispose();super.onDestroy();}
}
