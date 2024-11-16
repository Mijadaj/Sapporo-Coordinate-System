const inputLatLngElement = document.getElementById("latLng");
const divJochomeElement = document.getElementById("jochome");
//座標系のリスト作成
const selectSystemElement = document.getElementById("selectCoordinateSystem");
Object.keys(hgsSet).forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = hgsSet[key].name;
    selectSystemElement.appendChild(option);
});

//初期表示
let map, marker, redMarker;
let origin, zoom;
createMap();
createFormatJochome(coordinateSystem);
updateJochome();

//イベントリスナー
selectSystemElement.addEventListener("change", () => {
    updateCoordinateSystem();
    createMap();
    createFormatJochome(coordinateSystem);
    updateJochome();
    updateURL();
});
inputLatLngElement.addEventListener("change", () => {
    updateMarkerPosition();
    updateJochome();
    updateURL();
});
divJochomeElement.addEventListener("change", () => {
    updateLatLngByJochome();
    updateMarkerPosition();
    updateURL();
});

//地図表示関数
function createMap() {
    if (!map) {
        setParamsFromURL();
        origin = hgsSet[coordinateSystem].origin;
        const twintown = hgsSet[coordinateSystem].twintown;
        map = L.map("map", {
            center: origin,
            zoom: 6,
            minZoom: 2,
            maxZoom: 18,
            maxBounds: [
                [-90, -200],
                [90, 200]
            ],
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '© <a href="http://osm.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        // 原点を赤丸で表示
        redMarker = L.circleMarker(origin, {
            color: "red",
            fillColor: "red",
            fillOpacity: 1,
            radius: 5
        }).addTo(map);
        map.on("zoomend", updateURL);
        const initialMarkerPos = latLng || twintown;
        marker = L.marker(initialMarkerPos, { draggable: true }).addTo(map);
        // 初期位置を<input>フィールドに表示
        inputLatLngElement.value = initialMarkerPos.join(", ");
        latLng ? map.setView(initialMarkerPos, zoom) : map.fitBounds([origin, twintown])
        latLng = initialMarkerPos;
        marker.on("dragend", function(e) {
            const newLatLng = e.target.getLatLng();
            //マーカーの位置を制限
            const lat = Math.max(Math.min(newLatLng.lat, 90), -90);
            const lng = Math.max(Math.min(newLatLng.lng, 180), -180);
            //経緯度を更新
            inputLatLngElement.value = `${lat}, ${lng}`;
            marker.setLatLng([lat, lng])
            map.setView([lat, lng]);
            updateJochome();
            updateURL();
        });
    } else {
        const twintown = hgsSet[coordinateSystem].twintown;
        redMarker.setLatLng(origin);
        marker.setLatLng(twintown);
        map.fitBounds([origin, twintown]);
        latLng = twintown;
        inputLatLngElement.value = twintown.join(", ");
    }
};

function updateCoordinateSystem() {
    //変数の更新
    coordinateSystem = selectSystemElement.value
    origin = hgsSet[coordinateSystem].origin
    originLat = radians(origin[0]);
    originLat1 = atan(sub(1, e2).mul(tan(originLat)))
    originLng = radians(origin[1]);
    dec = radians(hgsSet[coordinateSystem].declination)
    const optionToRemove = document.getElementById("initialOption")
    if (optionToRemove) {
        optionToRemove.remove()
    };
};
//?coordinateSystem=Sapporo&lat=51.500735341404415&lng=-0.12470101984158878
//urlクエリパラメータを代入
function setParamsFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const lat = urlParams.get('lat');
    const lng = urlParams.get('lng');
    const z = urlParams.get('z');
    const sys = urlParams.get('sys');
    const sys2 = urlParams.get('coordinateSystem');
    zoom = z || 6;
    if (!(lat && lng))
        return;
    latLng = [lat, lng];
    if (!(sys || sys2))
        return;
    selectSystemElement.value = sys || sys2;
    updateCoordinateSystem();
};

function updateURL() {
    updateLatLng()
    const newUrl = new URL(window.location.href);
    const lat = latLng[0];
    const lng = latLng[1];
    const zoom = map.getZoom();
    const currentSystem = selectSystemElement.value
    if (currentSystem) {
        newUrl.searchParams.set('sys', currentSystem);
        newUrl.searchParams.delete('coordinateSystem')
    }
    if (lat && lng) {
        newUrl.searchParams.set('lat', lat);
        newUrl.searchParams.set('lng', lng);
    } else {
        newUrl.searchParams.delete('lat');
        newUrl.searchParams.delete('lng');
    }
    if (zoom) {
        newUrl.searchParams.set('z', zoom)
    }
    history.pushState(null, '', newUrl);
};

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
    jochome[0] = selectedText("selectJo");
    jochome[1] = document.getElementById("joNumber").value
    jochome[2] = selectedText("selectChome");
    jochome[3] = document.getElementById("chomeNumber").value
    if (jochome[0] == "大通") {
        switchAppearanceJo("odori");
        jochome[1] = 0;
    } else {
        switchAppearanceJo("directional");
    }
    if (hgsSet[coordinateSystem].joOffset[0] == "latitudinal") {
        blockPosition[0] = dirSign[jochome[0]]*jochome[1];
        blockPosition[1] = dirSign[jochome[2]]*jochome[3];
    }
    else {
        blockPosition[1] = dirSign[jochome[0]]*jochome[1];
        blockPosition[0] = dirSign[jochome[2]]*jochome[3];
    }
    const latLngHGS = blockPosition2hgs(blockPosition);
    latLng = hgs2wgs(latLngHGS)
    document.getElementById("latLng").value = latLng.join(", ");
};

function updateJochome() {
    jochome = getJochome();
    const elementJoNumber = document.getElementById("joNumber");
    const elementChomeNumber = document.getElementById("chomeNumber");
    if (jochome[0] == "大通") {
        switchAppearanceJo("odori");
        selectOptionByText("selectJo", jochome[0]);
        selectOptionByText("selectChome", jochome[2]);
        elementChomeNumber.value = jochome[3];
    }
    else {
        switchAppearanceJo("directional");
        selectOptionByText("selectJo", jochome[0]);
        elementJoNumber.value = jochome[1];
        selectOptionByText("selectChome", jochome[2]);
        elementChomeNumber.value = jochome[3];
    }
};

function getJochome() {
    updateLatLng()
    const hgsCoordinates = wgs2hgs(latLng); //see conv.js
    const blockPosition = hgs2blockPosition(hgsCoordinates);
    let jo, chome, eastWest, northSouth;
    if (hgsSet[coordinateSystem].joOffset[0] == "latitudinal") {
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
        jochome = [northSouth, Math.abs(jo), eastWest, Math.abs(chome)];
    }
    else {
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
        jochome = [eastWest, Math.abs(jo), northSouth, Math.abs(chome)];
    };
    return jochome;
};
function updateMarkerPosition() {
    updateLatLng()
    const newLat = parseFloat(latLng[0]);
    const newLng = parseFloat(latLng[1]);

    if (!isNaN(newLat) && !isNaN(newLng)) {
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
    if (state == "odori") {
        elementJoNumber.style.display = "none";
        elementJo.textContent = "";
    } else if (state = "directional") {
        elementJoNumber.style.display = "initial";
        elementJo.textContent = "条";
    };
};

function selectOptionByText(id, text) {
    const select = document.getElementById(id);
    const options = Array.from(select.options); // 全てのoption要素を配列として取得
    const option = options.find(opt => opt.textContent === text);
    if (option) {
      option.selected = true; // 該当のoptionを選択状態に
    };
};
function updateLatLng() {
    const inputLatLng = document.getElementById("latLng").value;
    latLng = inputLatLng.split(",").map(item => parseFloat(item.trim()))
};