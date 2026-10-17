package jp.omoide.closet;

import android.service.dreams.DreamService;

public class ClosetDreamService extends DreamService {
    private MemorySlideView slides;
    @Override public void onAttachedToWindow(){super.onAttachedToWindow();setInteractive(false);setFullscreen(true);setScreenBright(false);slides=new MemorySlideView(this);setContentView(slides);}
    @Override public void onDreamingStarted(){super.onDreamingStarted();if(slides!=null)slides.start();}
    @Override public void onDreamingStopped(){if(slides!=null)slides.stop();super.onDreamingStopped();}
    @Override public void onDetachedFromWindow(){if(slides!=null){slides.dispose();slides=null;}super.onDetachedFromWindow();}
}
