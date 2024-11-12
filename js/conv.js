const hgsSet = {
    Sapporo: {
        name: "大札幌 座標系",
        format: [["北", "南", "大通"], ["東", "西"]],
        jo: "latitudinal",
        origin: [43.061138, 141.357079],
        declination: 10.5842138889,
        blockSizeLatLng: [0.001170046801872075, 0.0011661354271942782],
        twintown: [55.030117, 82.921229], //ノボシビルスク, レーニン広場
    },
    Obihiro: {
        name: "帯広 座標系",
        format: [["西", "東", "大通"], ["南", "北"]],
        jo: "longitudinal",
        origin: [42.932044, 143.204010],
        declination: 5.59292777778,
        blockSizeLatLng: [0.001170168504264614, 0.0011660447761194029],
        twintown: [33.23956, 131.60936], //大分市役所
    },
    Nayoro: {
        name: "名寄 座標系",
        format: [["西", "東", "大通"], ["南", "北"]],
        jo: "longitudinal",
        origin: [44.356392, 142.463787],
        declination: 0.0992,
        blockSizeLatLng: [0.001169909916936396, 0.0011659012740710033],
        twintown: [47.32737, 142.79453], //ドリンスク, レーニン広場
    },
    Nakashibetsu: {
        name: "中標津 座標系",
        format: [["東", "西", "大通"], ["南", "北"]],
        jo: "longitudinal",
        origin: [43.548025, 144.973040],
        declination: 42.1626611111,
        blockSizeLatLng: [0.0008177655011993894, 0.0008174683912222061],
        twintown: [35.53089, 139.703], //川崎市役所
    }
    /*
    template: {
        name: " 座標系",
        format: [[, ], [, ]],
        origin: [, ],
        declination: ,
        blockSizeLatLng: ,
        twintown: [, ]
    },
    Bibai: {},
    Shibetsu: {},
    */
};
let format, blockPosition;
let coordinateSystem = "Sapporo";

Decimal.set({
    precision: 30,
    rounding: 4,
    minE: -20,
});
//Decimal のメソッドをラップ
const sub = (x, y) => Decimal.sub(x, y);
const sqrt = (x) => Decimal.sqrt(x);
const sin = (x) => Decimal.sin(x);
const cos = (x) => Decimal.cos(x);
const tan = (x) => Decimal.tan(x);
const asin = (x) => Decimal.asin(x);
const acos = (x) => Decimal.acos(x);
const atan = (x) => Decimal.atan(x);
const atan2 = (y, x) => Decimal.atan2(y, x);

//定数の定義
const f = Decimal.div(1, 298.257223563); //扁平率
const e2 = f.mul(sub(2, f)); //離心率の2乗
const pi = acos(-1);

const radians = (deg) => Decimal.div(pi, 180).mul(deg);
const degrees = (rad) => Decimal.div(180, pi).mul(rad);

let originLat = radians(hgsSet[coordinateSystem].origin[0]);
let originLat1 = atan(sub(1, e2).mul(tan(originLat)))
let originLng = radians(hgsSet[coordinateSystem].origin[1]);
let dec = radians(hgsSet[coordinateSystem].declination)

//wgs84の経緯度をhgsの経緯度に変換
function wgs2hgs(lat, lng) {
    const latRad = radians(lat);
    const lngRad = radians(lng);
    //地点(lat, lng)を指すベクトルをHGSに変換: (X, Y, Z)
    const f = (phi, delta) => {
        const a = sub(1, e2).mul(cos(phi)).mul(cos(delta)).mul(sin(latRad));
        const b = cos(latRad).mul(sin(delta).mul(sin(lngRad.sub(originLng))).add(sin(phi).mul(cos(delta)).mul(cos(lngRad.sub(originLng)))));
        return sub(a, b)
    };
    const X = f(originLat1.sub(pi.div(2)), 0)
    const Y = f(originLat1, dec.sub(pi.div(2)))
    const Z = f(originLat1, dec)

    let LAT = degrees(asin(Z.div(sqrt(sin(latRad).pow(2).mul(e2.pow(2).sub(e2.mul(2))).add(1)))));
    let LNG = degrees(atan2(Y, X));
    LAT = LAT.toDecimalPlaces(15);
    LNG = LNG.toDecimalPlaces(15);
    return [LAT, LNG]
};

//hgsの経緯度をwgsの経緯度に変換
function hgs2wgs(LAT, LNG) {
    const LATRad = radians(LAT);
    const LNGRad = radians(LNG);
    //HGS上の地点(LAT, LNG)を指す単位ベクトルをWGSに変換: (nx, ny, nz)
    const g = (alpha, lambda) => {
        const a = sin(LATRad).mul(sin(dec).mul(sin(lambda)).sub(sin(alpha).mul(cos(dec)).mul(cos(lambda))));
        const b = cos(LATRad).mul(sin(LNGRad)).mul(sin(lambda).mul(cos(dec)).add(sin(dec).mul(sin(alpha)).mul(cos(lambda))));
        const c = cos(LATRad).mul(cos(LNGRad)).mul(cos(alpha)).mul(cos(lambda));
        return a.sub(b).add(c);
    };
    const nx = g(originLat1, originLng);
    const ny = g(originLat1, originLng.sub(pi.div(2)));
    const nz = g(originLat1.sub(pi.div(2)), 0);

    let lat = degrees(asin(nz.div(sqrt(sub(1, e2).pow(2).mul(nx.pow(2).add(ny.pow(2))).add(nz.pow(2))))));
    let lng = degrees(atan2(ny, nx));
    lat = lat.toDecimalPlaces(15);
    lng = lng.toDecimalPlaces(15);
    return [lat, lng]
};

//HGS経緯度から条丁目を算出
function getBlockPosition(LATLNG) {
    let latitudinalBlock = Decimal.abs(LATLNG[0]).div(hgsSet[coordinateSystem].blockSizeLatLng[0]).floor();
    let longitudinalBlock = Decimal.abs(LATLNG[1]).div(hgsSet[coordinateSystem].blockSizeLatLng[1]).floor();
    latitudinalBlock = Decimal(Math.sign(LATLNG[0])).mul(latitudinalBlock);
    longitudinalBlock = Decimal(Math.sign(LATLNG[1])).mul(longitudinalBlock);
    blockPosition = [latitudinalBlock, longitudinalBlock]
    return blockPosition;
};

//条丁目からHGS経緯度を算出
function getLatLng(latLngBlock) {
    const LAT = new Decimal(latLngBlock[0]).sub(1).mul(hgsSet[coordinateSystem].blockSizeLatLng[0]);
    const LNG = new Decimal(latLngBlock[1]).sub(1).mul(hgsSet[coordinateSystem].blockSizeLatLng[1]);
    return [LAT, LNG]
};