//座標系のリスト作成
const selectSystemElement = document.getElementById("selectCoordinateSystem");
Object.keys(hgsSet).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = hgsSet[key].name;
    selectSystemElement.appendChild(option);
});

//初期表示
let map, marker;
let inputLatLng, latLngArray;
createMap(coordinateSystem);
createFormatJochome(coordinateSystem);
updateJochome();
setSystemFromURL();

//座標系の更新
selectSystemElement.addEventListener("change", function() {
    //変数の更新
    coordinateSystem = selectSystemElement.value
    originLat = radians(hgsSet[coordinateSystem].origin[0]);
    originLat1 = atan(sub(1, e2).mul(tan(originLat)))
    originLng = radians(hgsSet[coordinateSystem].origin[1]);
    dec = radians(hgsSet[coordinateSystem].declination)
    //表示更新
    createMap(coordinateSystem);
    createFormatJochome(coordinateSystem);
    const optionToRemove = document.getElementById("initialOption")
    if (optionToRemove) {
        optionToRemove.remove()
    };
    updateURL();
});

// 緯度と経度の入力フィールドにイベントリスナーを追加
document.getElementById("latLng").addEventListener("change", updateMarkerPosition);
document.getElementById("latLng").addEventListener("change", updateJochome);
document.getElementById("latLng").addEventListener("change", updateURL);
document.getElementById("jochome").addEventListener("change", updateLatLngByJochome);

//urlクエリパラメータを代入
function setInputFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    if (lat && lng) {
        latLngArray = [lat, lng]
        document.getElementById('latLng').value = `${lat}, ${lng}`;
        document.getElementById("latLng").dispatchEvent(new Event("change"));
    }
};

function setSystemFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    coordinateSystem = urlParams.get('coordinateSystem')
    if (coordinateSystem) {
        selectSystemElement.value = coordinateSystem
    };
};

function updateURL() {
    updateLatLng()
    const lat = latLngArray[0];
    const lng = latLngArray[1];
    alert(latLngArray)
    const newUrl = new URL(window.location.href);
    coordinateSystem = selectSystemElement.value
    newUrl.searchParams.set('coordinateSystem', coordinateSystem);
    if (lat && lng) {
        newUrl.searchParams.set('lat', lat);
        newUrl.searchParams.set('lng', lng);
    } else {
        newUrl.searchParams.delete('lat');
        newUrl.searchParams.delete('lng');
    }
    history.pushState(null, '', newUrl);
}

//条丁目の形式を表示
function createFormatJochome(selectedSystem) {
    deleteOptionJochome();
    const formatJo = hgsSet[selectedSystem].format[0];
    const formatChome = hgsSet[selectedSystem].format[1];
    formatJo.forEach((optionText, i) => {
        const selectElement = document.getElementById("selectJo");
        const option = document.createElement("option");
        option.value = `jo${i + 1}`;
        option.textContent = optionText;
        selectElement.appendChild(option);
    });
    formatChome.forEach((optionText, i) => {
        const selectElement = document.getElementById("selectChome");
        const option = document.createElement("option");
        option.value = `chome${i + 1}`;
        option.textContent = optionText;
        selectElement.appendChild(option);
    });
};
//座標系変更時に条丁目をリセット
function deleteOptionJochome() {
    const parentDiv = document.getElementById("jochome");
    const valuesToDelete = ["jo1", "jo2", "jo3", "chome1", "chome2"];
    const elementsToDelete = parentDiv.querySelectorAll("option");
    elementsToDelete.forEach(element => {
        if (valuesToDelete.includes(element.value)) {
            element.remove();
        };
    });
};

//地図表示関数
function createMap(selectedSystem) {
    if (map) {
        map.remove();
    };
    const origin = hgsSet[selectedSystem].origin;
    const twintown = hgsSet[selectedSystem].twintown;
    map = L.map("map", {
        center: origin,
        zoom: 13,
        maxBounds: [
            [-90, -200],
            [90, 200]
        ],
    });
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a>',
    });
    tileLayer.addTo(map);

    // 原点を赤丸で表示
    L.circleMarker(origin, {
        color: "red",
        fillColor: "red",
        fillOpacity: 1,
        radius: 5
    }).addTo(map);
    // マーカーの初期位置を姉妹都市に
    marker = L.marker(twintown, { draggable: true }).addTo(map);
    // 初期位置を<input>フィールドに表示
    document.getElementById("latLng").value = twintown.join(", ");
    // マーカーをドラッグして緯度経度を更新する
    marker.on("dragend", function(e) {
        const newLatLng = e.target.getLatLng();
        //マーカーの位置を制限
        const lat = Math.max(Math.min(newLatLng.lat, 90), -90);
        const lng = Math.max(Math.min(newLatLng.lng, 180), -180);
        
        const newCoordinate = [lat, lng]
        const evt = new Event("change");
        document.getElementById("latLng").value = newCoordinate.join(", ");
        document.getElementById("latLng").dispatchEvent(evt);
    });
    map.fitBounds([origin, twintown]);
};


function updateLatLngByJochome() {
    const selectedText = (id) => {
        const selectElement = document.getElementById(id);
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        return selectedOption.textContent;
    };
    const dirSign = {
        "東": 1,
        "北": 1,
        "西": -1,
        "南": -1,
        "大通": 0
    };
    format[0] = selectedText("selectJo");
    format[1] = document.getElementById("joNumber").value
    format[2] = selectedText("selectChome");
    format[3] = document.getElementById("chomeNumber").value
    if (hgsSet[coordinateSystem].jo == "longitude") {
        blockPosition[1] = dirSign[format[0]]*format[1];
        blockPosition[0] = dirSign[format[2]]*format[3];
    }
    else {
        blockPosition[0] = dirSign[format[0]]*format[1];
        blockPosition[1] = dirSign[format[2]]*format[3];
    }
    const latLngHGS = getLatLng(blockPosition);
    const latLng = hgs2wgs(latLngHGS[0], latLngHGS[1])
    const evt = new Event("change")
    document.getElementById("latLng").value = latLng;
    document.getElementById("latLng").dispatchEvent(evt);
};

function updateJochome() {
    const format = getJochome();
    const elementJoNumber = document.getElementById("joNumber");
    const elementChomeNumber = document.getElementById("chomeNumber");
    if (format[0] === "大通") {
        switchAppearanceJo("odori");
        selectOptionByText("selectJo", format[0]);
        selectOptionByText("selectChome", format[2]);
        elementChomeNumber.value = format[3];
    }
    else {
        switchAppearanceJo("directional");
        selectOptionByText("selectJo", format[0]);
        elementJoNumber.value = format[1];
        selectOptionByText("selectChome", format[2]);
        elementChomeNumber.value = format[3];
    }
};

function getJochome() {
    updateLatLng()
    const hgsCoordinates = wgs2hgs(latLngArray[0], latLngArray[1]); //see conv.js
    const blockPosition = getBlockPosition(hgsCoordinates);
    let jo, chome, eastWest, northSouth;
    if (hgsSet[coordinateSystem].jo === "longitudinal") {
        jo = blockPosition[1];
        chome = blockPosition[0];
        northSouth = chome > 0 ? "北" : "南";
        switch (Math.sign(jo)) {
            case 1:
                eastWest = "東";
                break;
            case -1:
                eastWest = "西";
                break;
            case 0:
                eastWest = "大通"
                break
        };
        format = [eastWest, Math.abs(jo), northSouth, Math.abs(chome)];
    }
    else {
        jo = blockPosition[0];
        chome = blockPosition[1];
        eastWest = chome > 0 ? "東" : "西";
        switch (Math.sign(jo)) {
            case 1:
                northSouth = "北";
                break;
            case -1:
                northSouth = "南";
                break;
            case 0:
                northSouth = "大通"
                break
        };
        format = [northSouth, Math.abs(jo), eastWest, Math.abs(chome)];
    };
    return format;
};
function updateMarkerPosition() {
    updateLatLng()
    const newLat = parseFloat(latLngArray[0]);
    const newLng = parseFloat(latLngArray[1]);

    if (!isNaN(newLat) && !isNaN(newLng)) {
        // マーカーがすでに存在する場合のみ更新
        if (marker) {
            marker.setLatLng([newLat, newLng]);
            map.setView([newLat, newLng]);  // 地図の表示位置も合わせて移動
        }
    }
};

//大通を選択時に条を非表示にする
function switchAppearanceJo(state) {
    const elementJoNumber = document.getElementById("joNumber");
    const elementJo = document.getElementById("jo");
    if (state == "odori" && elementJoNumber) {
        elementJoNumber.remove();
        elementJo.textContent = "";
    }
    else if (state = "directional" && !elementJoNumber) {
        const parent = document.getElementById("jochome");
        const input = document.createElement("input");
        input.id = "joNumber";
        input.type = "text";
        input.className = "jochome";
        parent.insertBefore(input, parent.children[1]);
        elementJo.textContent += "条";
    };
};

function selectOptionByText(id, text) {
    const select = document.getElementById(id);
    const options = Array.from(select.options); // 全ての<option>要素を配列として取得
    const option = options.find(opt => opt.textContent === text);
    if (option) {
      option.selected = true; // 該当の<option>を選択状態に
    };
};
function updateLatLng() {
    inputLatLng = document.getElementById("latLng").value;
    latLngArray = inputLatLng.split(",").map(item => parseFloat(item.trim()))
};

setInputFromURL();