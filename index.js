/**==================
 * LOCATIONS ARRAY
=====================*/
const locations = [
    { nombre: "Monumento a los Héroes de la Restauración", latitud: 19.4516, longitud: -70.6970, color: 'hsl(0, 97%, 50%)' },
    { nombre: "Catedral de Santiago Apóstol", latitud: 19.4512, longitud: -70.6934, color: 'hsl(118, 97%, 50%)' },
    { nombre: "Centro León", latitud: 19.4425, longitud: -70.6836, color: 'hsl(0, 97%, 50%)' },
    { nombre: "Estadio Cibao", latitud: 19.4367, longitud: -70.7186, color: 'hsl(0, 97%, 50%)' },
    { nombre: "Mercado Modelo", latitud: 19.4493, longitud: -70.6918, color: 'hsl(0, 97%, 50%)' },
    { nombre: "Universidad Tecnológica de Santiago (UTESA)", latitud: 19.4386, longitud: -70.7005, color: 'hsl(118, 97%, 50%)' },
    { nombre: "Plaza Internacional", latitud: 19.4567, longitud: -70.6889, color: 'hsl(0, 97%, 50%)' },
    { nombre: "PUCMM (Pontificia Universidad Católica Madre y Maestra)", latitud: 19.4420, longitud: -70.7130, color: 'hsl(118, 97%, 50%)' },
];

/**==========================================================
 * GET MY LOCATION FUNCTION
 * @returns {Promise<{latitud: number, longitud: number}>}
=============================================================*/
const getLocation = async () => {

    return new Promise((resolve, reject) => {

        if ("geolocation" in navigator) {

            // THE BROWSER SUPPORTS THE GEOLOCATION API //
            navigator.geolocation.getCurrentPosition((position) => {

                // SUCCESS IN OBTAINING THE LOCATION //
                const latitud = position.coords.latitude;
                const longitud = position.coords.longitude;
                resolve({ latitud, longitud }); // SOLVE THE PROMISE WITH THE COORDINATES //

            }, (error) => {

                // ERROR OBTAINING LOCATION
                reject(`Error obtaining the location: ${error.message}`); // REJECTS THE PROMISE WITH ERROR //

            });

        } else {

            // BROWSER DOES NOT SUPPORT GEOLOCATION API //
            reject("Geolocation is not supported in this browser.");

        }

    });

}

(async () => {

    try {

        const myLocation = await getLocation();

        // CONFIGURE THE MAP WITH MAPBOX //
        mapboxgl.accessToken = "pk.eyJ1IjoicmFuZHloeXRlY2giLCJhIjoiY204aG9rN3Q0MDNucDJrcHU0MjFhNmxiMCJ9.060bIhavAGwruP3v3JTkxg";

        const map = new mapboxgl.Map({
            container: "map",
            center: [myLocation.longitud, myLocation.latitud], // USE THE COORDINATES OBTAINED //
            zoom: 5,
            style: "mapbox://styles/mapbox/streets-v12",
        });

        new mapboxgl.Marker().setLngLat([myLocation.longitud, myLocation.latitud]).addTo(map)

        // FUNCTION TO CREATE A CUSTOM MARKER WITH A PIN ICON
        const createCustomMarker = (color) => {
            const el = document.createElement('div');
            el.className = 'marker';
            el.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="40px" height="40px">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `;
            el.style.width = '40px';
            el.style.height = '40px';
            return el;
        };

        // FUNCTION TO ADD THE ROUTE SOURCE AND LAYER //
        const addRouteSourceAndLayer = (map) => {

            if (!map.getSource('route')) {

                map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': []
                        }
                    }
                });

                map.addLayer({
                    'id': 'route',
                    'type': 'line',
                    'source': 'route',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#3b82f6',
                        'line-width': 4
                    }
                });

            }

        };

        // ADD THE ROUTE SOURCE AND LAYER WHEN THE MAP IS LOADED //
        map.on('load', () => {
            addRouteSourceAndLayer(map);
        });

        // FUNCTION TO OBTAIN A ROUTE USING THE MAPBOX DIRECTIONS API //
        const getRoute = async (start, end) => {

            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {

                return data.routes[0].geometry.coordinates;

            } else {

                throw new Error("The route could not be calculated.");

            }

        };

        // VARIABLE TO STORE THE SELECTED LOCATION //
        let selectedLocation = null;

        // GLOBAL VARIABLE TO TRACK THE STATUS OF THE ROUTE //
        let isRouteActive = false;

        // STORES THE LOCATION THAT HAS THE TRACED ROUTE //
        let activeLocation = null;

        // FUNCTION TO SHOW BOTTOM SHEET //
        const showBottomSheet = () => {
            const bottomSheet = document.getElementById('bottom-sheet');
            bottomSheet.classList.add('show');
        };

        // FUNCTION TO HIDE BOTTOM SHEET //
        const hideBottomSheet = () => {
            const bottomSheet = document.getElementById('bottom-sheet');
            bottomSheet.classList.remove('show');
        };

        // ADD A MARKER AT THE OBTAINED LOCATIONS //
        locations.forEach(location => {

            const marker = new mapboxgl.Marker(createCustomMarker(location.color)).setLngLat([location.longitud, location.latitud]).addTo(map);

            // ADD CLICK EVENT TO THE MARKER //
            marker.getElement().addEventListener('click', async () => {

                // SAVE THE SELECTED LOCATION //
                selectedLocation = location;

                // IF THERE IS AN ACTIVE ROUTE AND THE SELECTED MARKER IS THE SAME, DISPLAY “REMOVE ROUTE” //
                if (isRouteActive && activeLocation === selectedLocation) {
                    traceButton.style.display = 'none';
                    removeButton.style.display = 'inline-block';
                    document.getElementById('bottom-sheet-button').style.display = 'none';
                    document.getElementById('remove-route-bottom-sheet-button').style.display = 'inline-block';
                } else {
                    traceButton.style.display = 'inline-block';
                    removeButton.style.display = 'none';
                    document.getElementById('bottom-sheet-button').style.display = 'inline-block';
                    document.getElementById('remove-route-bottom-sheet-button').style.display = 'none';
                }

                // SET THE CONTENT FOR BOTH MODAL AND BOTTOM SHEET //
                document.getElementById('modal-title').textContent = location.nombre;
                document.getElementById('modal-description').textContent = `Latitud: ${location.latitud}, Longitud: ${location.longitud}`;
                document.getElementById('bottom-sheet-title').textContent = location.nombre;
                document.getElementById('bottom-sheet-description').textContent = `Latitud: ${location.latitud}, Longitud: ${location.longitud}`;

                // SHOW MODAL OR BOTTOM SHEET BASED ON SCREEN SIZE /
                if (window.innerWidth <= 768) {
                    showBottomSheet();
                } else {
                    document.getElementById('location-modal').style.display = 'block';
                }

            });

        });

        // GET THE BUTTONS //
        const traceButton = document.getElementById('location-modal-button');
        const removeButton = document.getElementById('remove-route-button');
        const bottomSheetTraceButton = document.getElementById('bottom-sheet-button');
        const bottomSheetRemoveButton = document.getElementById('remove-route-bottom-sheet-button');

        // FUNCTION TO TRACE ROUTE //
        const traceRoute = async () => {
            if (selectedLocation) {
                try {
                    const start = [myLocation.longitud, myLocation.latitud];
                    const end = [selectedLocation.longitud, selectedLocation.latitud];
                    const routeCoordinates = await getRoute(start, end);
        
                    // UPDATE THE ROUTE SOURCE //
                    const routeSource = map.getSource('route');
                    routeSource.setData({
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': routeCoordinates
                        }
                    });
        
                    // MARK THE ROUTE AS ACTIVE AND UPDATE BUTTONS //
                    isRouteActive = true;
                    activeLocation = selectedLocation;
        
                    // HIDE THE TRACE BUTTON AND SHOW REMOVE //
                    traceButton.style.display = 'none';
                    removeButton.style.display = 'inline-block';
                    bottomSheetTraceButton.style.display = 'none';
                    bottomSheetRemoveButton.style.display = 'inline-block';
        
                    // CLOSE THE MODAL OR BOTTOM SHEET //
                    if (window.innerWidth <= 768) {
                        hideBottomSheet();
                    } else {
                        document.getElementById('location-modal').style.display = 'none';
                    }
                } catch (error) {
                    console.error("Error when calculating the route:", error);
                }
            }
        };

        // FUNCTION TO REMOVE ROUTE //
        const removeRoute = () => {
            // CLEAN THE ROUTE //
            const routeSource = map.getSource('route');
            routeSource.setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': []
                }
            });
        
            // MARK ROUTE AS INACTIVE AND UPDATE BUTTONS //
            isRouteActive = false;
            activeLocation = null;
        
            // SHOW TRACE BUTTON AND HIDE REMOVE //
            traceButton.style.display = 'inline-block';
            removeButton.style.display = 'none';
            bottomSheetTraceButton.style.display = 'inline-block';
            bottomSheetRemoveButton.style.display = 'none';
        
            // CLOSE THE MODAL OR BOTTOM SHEET //
            if (window.innerWidth <= 768) {
                hideBottomSheet();
            } else {
                document.getElementById('location-modal').style.display = 'none';
            }
        };

        // MODAL “ACTION” BUTTON CLICK EVENT //
        traceButton.addEventListener('click', traceRoute);
        bottomSheetTraceButton.addEventListener('click', traceRoute);

        // CLICK ON “REMOVE ROUTE” EVENT //
        removeButton.addEventListener('click', removeRoute);
        bottomSheetRemoveButton.addEventListener('click', removeRoute);

        // CLOSE BOTTOM SHEET WHEN CLOSE BUTTON IS CLICKED
        document.querySelector('.close-bottom-sheet').addEventListener('click', () => {
            hideBottomSheet();
        });

        // CLOSE BOTTOM SHEET WHEN CLICKING OUTSIDE
        window.addEventListener('click', (event) => {
            const bottomSheet = document.getElementById('bottom-sheet');
            if (event.target === bottomSheet) {
                hideBottomSheet();
            }
        });

        // ADJUST ZOOM TO MAKE ALL MARKERS VISIBLE //
        const bounds = new mapboxgl.LngLatBounds();
        locations.forEach(location => {
            bounds.extend([location.longitud, location.latitud]);
        });

        map.fitBounds(bounds, {
            padding: 50, // ADDITIONAL SPACE AROUND THE MARKERS //
            maxZoom: 16, // MAXIMUM ZOOM ALLOWED //
        });

        // CLOSE THE MODAL WHEN THE CLOSE BUTTON IS CLICKED //
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('location-modal').style.display = 'none';
        });

        // CLOSE THE MODAL WHEN CLICKING OUTSIDE OF IT //
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('location-modal')) {
                document.getElementById('location-modal').style.display = 'none';
            }
        });

        // TOGGLE BETWEEN MAP VIEWS //
        const normalViewButton = document.getElementById('normal-view');
        const satelliteViewButton = document.getElementById('satellite-view');

        // SET THE NORMAL VIEW AS DEFAULT //
        normalViewButton.addEventListener('click', () => {
            map.setStyle('mapbox://styles/mapbox/streets-v12');
            normalViewButton.classList.add('active');
            satelliteViewButton.classList.remove('active');
        });

        // SET THE SATELLITE VIEW //
        satelliteViewButton.addEventListener('click', () => {
            map.setStyle('mapbox://styles/mapbox/satellite-v9');
            satelliteViewButton.classList.add('active');
            normalViewButton.classList.remove('active');
        });

        // RE-ADD ROUTE SOURCE AND LAYER WHEN STYLE CHANGES //
        map.on('styledata', () => {

            addRouteSourceAndLayer(map);

            if (isRouteActive && activeLocation) {

                const start = [myLocation.longitud, myLocation.latitud];
                const end = [activeLocation.longitud, activeLocation.latitud];

                getRoute(start, end).then(routeCoordinates => {

                    const routeSource = map.getSource('route');

                    routeSource.setData({
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': routeCoordinates
                        }
                    });
                }).catch(error => {

                    console.error("Error when recalculating the route:", error);

                });

                traceButton.style.display = 'none';

                removeButton.style.display = 'inline-block';

            } else {

                traceButton.style.display = 'inline-block';

                removeButton.style.display = 'none';

            }

        });

        // ADD THE “LOCATE ME” BUTTON //
        const locateMeButton = document.getElementById('locate-me');

        locateMeButton.addEventListener('click', () => {
            getLocation().then(location => {
                map.flyTo({
                    center: [location.longitud, location.latitud],
                    zoom: 15, // ADJUSTS ZOOM AS NEEDED //
                    essential: true // THIS ANIMATION SHALL BE CONSIDERED ESSENTIAL //
                });
            }).catch(error => {
                console.error("Error obtaining location:", error);
            });
        });

    } catch (error) {

        console.error("Error:", error);

    }

})();