const hgsSet = {
    Sapporo: {
        name: "大札幌 座標系",
        format: [["北", "南", "大通"], ["東", "西"]],
        joOffset: ["latitudinal", -0.000990033565819702, 0.00157505340016771], //30.8631511197875 m/sec
        origin: [43.061138, 141.357079],
        declination: 10.5842138889,
        blockSizeLatLng: [0.001170046801872075, 0.0011661354271942782],
        twintown: [55.030117, 82.921229], //ノボシビルスク, レーニン広場
    },
    Obihiro: {
        name: "帯広 座標系",
        format: [["西", "東", "大通"], ["南", "北"]],
        joOffset: ["longitudinal", -0.000618898932322025, 0.000618898932322025], //30.9689767839087 m/sec
        origin: [42.932044, 143.204010],
        declination: 5.59292777778,
        blockSizeLatLng: [0.001170168504264614, 0.0011660447761194029],
        twintown: [33.23956, 131.60936], //大分市役所
    },
    Nayoro: {
        name: "名寄 座標系",
        format: [["西", "東", "大通"], ["南", "北"]],
        joOffset: ["longitudinal", -0.000663668630632269, 0.000663668630632269], //30.9726188745316 m/sec
        origin: [44.356392, 142.463787],
        declination: 0.0992,
        blockSizeLatLng: [0.001169909916936396, 0.0011659012740710033],
        twintown: [47.32737, 142.79453], //ドリンスク, レーニン広場
    },
    Nakashibetsu: {
        name: "中標津 座標系",
        format: [["東", "西", "大通"], ["南", "北"]],
        joOffset: ["longitudinal", -0.000408735777291158, 0.000408735777291158], //30.9219050327609
        origin: [43.548025, 144.973040],
        declination: 42.1626611111,
        blockSizeLatLng: [0.0008177655011993894, 0.0008174683912222061],
        twintown: [35.53089, 139.703], //川崎市役所
    }
    /*
    template: {
        name: " 座標系",
        format: [[, ], [, ]],
        joOffset: [],
        origin: [, ],
        declination: ,
        blockSizeLatLng: ,
        twintown: [, ]
    },
    Bibai: {},
    Shibetsu: {},
    */
};

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

let latLng;
let blockPosition = [];
let jochome = [];
let coordinateSystem = "Sapporo";

let originLat = radians(hgsSet[coordinateSystem].origin[0]);
let originLat1 = atan(sub(1, e2).mul(tan(originLat)))
let originLng = radians(hgsSet[coordinateSystem].origin[1]);
let dec = radians(hgsSet[coordinateSystem].declination)

//wgs84の経緯度をhgsの経緯度に変換
function wgs2hgs([lat, lng]) {
    const latRad = radians(lat);
    const lngRad = radians(lng);
    //地点(lat, lng)を指すベクトルをHGSに変換: (X, Y, Z)
    const g = (phi, delta) => {
        const a = sub(1, e2).mul(cos(phi)).mul(cos(delta)).mul(sin(latRad));
        const b = cos(latRad).mul(sin(delta).mul(sin(lngRad.sub(originLng))).add(sin(phi).mul(cos(delta)).mul(cos(lngRad.sub(originLng)))));
        return sub(a, b)
    };
    const X = g(originLat1.sub(pi.div(2)), 0)
    const Y = g(originLat1, dec.sub(pi.div(2)))
    const Z = g(originLat1, dec)

    let LAT = degrees(asin(Z.div(sqrt(sin(latRad).pow(2).mul(e2.pow(2).sub(e2.mul(2))).add(1)))));
    let LNG = degrees(atan2(Y, X));
    LAT = LAT.toDecimalPlaces(15);
    LNG = LNG.toDecimalPlaces(15);
    return [LAT, LNG]
};

//hgsの経緯度をwgsの経緯度に変換
function hgs2wgs([LAT, LNG]) {
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

//HGS経緯度から区画の位置を算出
function hgs2blockPosition([LAT, LNG]) {
    const offset = hgsSet[coordinateSystem].joOffset //大通の幅に対する補正
    const latDegPerBlock = hgsSet[coordinateSystem].blockSizeLatLng[0];
    const lngDegPerBlock = hgsSet[coordinateSystem].blockSizeLatLng[1];
    const adjustJo = function(deg, degPerBlock) {
        let pos;
        if (deg <= offset[1]) {
            pos = sub(deg, offset[1]).div(degPerBlock).ceil().sub(1);
            return pos;
        } else if (offset[2] <= deg) {
            pos = sub(deg, offset[2]).div(degPerBlock).floor().add(1);
            return pos;
        } else {
            return 0;
        }
    };
    let latitudinalBlock, longitudinalBlock;
    if (offset[0] == "latitudinal") {
        latitudinalBlock = adjustJo(LAT, latDegPerBlock);
        longitudinalBlock = Decimal.abs(LNG).div(lngDegPerBlock).floor().add(1);
        longitudinalBlock = Decimal(Math.sign(LNG)).mul(longitudinalBlock);
    } else {
        latitudinalBlock = Decimal.abs(LAT).div(latDegPerBlock).floor().add(1);
        latitudinalBlock = Decimal(Math.sign(LAT)).mul(latitudinalBlock);
        longitudinalBlock = adjustJo(LNG, lngDegPerBlock);
    };
    blockPosition = [latitudinalBlock, longitudinalBlock];
    return blockPosition;
};

//区画の位置からHGS経緯度を算出
function blockPosition2hgs([latitudinalBlock, longitudinalBlock]) {
    const offset = hgsSet[coordinateSystem].joOffset; //大通の幅に対する補正
    const latDegPerBlock = hgsSet[coordinateSystem].blockSizeLatLng[0];
    const lngDegPerBlock = hgsSet[coordinateSystem].blockSizeLatLng[1];
    const restoreDeg = function(jo, degPerBlock) {
        let deg;
        switch (Math.sign(jo)) {
            case 1:
                deg = sub(jo, 1).mul(degPerBlock).add(offset[2])
                break
            case -1:
                deg = sub(jo, -1).mul(degPerBlock).add(offset[1])
                break
            case 0:
                deg = 0
                break
        }
        return deg;
    };
    let LAT, LNG;
    if (offset[0] == "latitudinal") {
        LAT = restoreDeg(latitudinalBlock, latDegPerBlock);
        LNG = Decimal(longitudinalBlock).mul(lngDegPerBlock);
    } else {
        LAT = Decimal(latitudinalBlock).mul(latDegPerBlock);
        LNG = restoreDeg(longitudinalBlock, lngDegPerBlock);
    };
    return [LAT, LNG]
};