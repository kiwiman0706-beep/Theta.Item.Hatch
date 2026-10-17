package jp.omoide.closet;

import org.json.JSONObject;
import java.util.Arrays;

/** JSON records stay compatible with the original database and backups. */
final class ItemTypes {
    static final String[] CATEGORIES={"シャツ","Tシャツ","ズボン","ワンピース","スカート","トレーナー","ニット","カーディガン","上着","ロンパース","オーバーオール","パジャマ","帽子","くつ","バッグ","ヘアアクセサリー","ネックレス","ブレスレット","アクセサリー","ぬいぐるみ","人形","ミニカー","ブロック","おもちゃ","絵本","思い出の品","その他"};
    static final String[] KINDS={"clothes","accessory","toy","other"};
    static final String[] ROLES={"top","bottom","onepiece","none"};
    static String inferKind(String category) {
        if(Arrays.asList("帽子","くつ","バッグ","ヘアアクセサリー","ネックレス","ブレスレット","アクセサリー").contains(category))return "accessory";
        if(Arrays.asList("ぬいぐるみ","人形","ミニカー","ブロック","おもちゃ").contains(category))return "toy";
        if(Arrays.asList("絵本","思い出の品").contains(category))return "other";
        return "clothes";
    }
    static String kind(JSONObject item){String v=item.optString("kind");return Arrays.asList(KINDS).contains(v)?v:inferKind(item.optString("category"));}
    static String inferRole(String category) {
        if(Arrays.asList("シャツ","Tシャツ","トレーナー","ニット","カーディガン","上着").contains(category))return "top";
        if(Arrays.asList("ズボン","スカート").contains(category))return "bottom";
        if(Arrays.asList("ワンピース","ロンパース","オーバーオール","パジャマ").contains(category))return "onepiece";
        return "none";
    }
    static String role(JSONObject item) {
        if(!"clothes".equals(kind(item)))return "none";
        String v=item.optString("wardrobeRole");return Arrays.asList(ROLES).contains(v)?v:inferRole(item.optString("category"));
    }
    static JSONObject normalize(JSONObject item)throws Exception {
        if(!Arrays.asList(CATEGORIES).contains(item.optString("category")))item.put("category","その他");
        item.put("kind",kind(item));item.put("wardrobeRole",role(item));return item;
    }
}
