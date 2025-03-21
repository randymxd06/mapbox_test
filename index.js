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

        // ADD A MARKER AT THE OBTAINED LOCATIONS //
        locations.forEach(location => {

            const marker = new mapboxgl.Marker(createCustomMarker(location.color)).setLngLat([location.longitud, location.latitud]).addTo(map);

            // ADD CLICK EVENT TO THE MARKER //
            marker.getElement().addEventListener('click', () => {

                // SET THE MODAL CONTENT //
                document.getElementById('modal-title').textContent = location.nombre;
                document.getElementById('modal-description').textContent = `Latitud: ${location.latitud}, Longitud: ${location.longitud}`;

                // SHOW THE MODAL //
                document.getElementById('modal').style.display = 'block';

            });

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
            document.getElementById('modal').style.display = 'none';
        });

        // CLOSE THE MODAL WHEN CLICKING OUTSIDE OF IT //
        window.addEventListener('click', (event) => {
            if (event.target === document.getElementById('modal')) {
                document.getElementById('modal').style.display = 'none';
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