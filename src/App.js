import { useEffect, useRef } from "react";
import "./App.css";
import { Viewer } from "resium";
import * as Cesium from "cesium";
import FlightData from "./data/FlightData";

Cesium.Ion.defaultAccessToken = process.env.REACT_APP_CESIUM_ION_TOKEN;

const terrainProvider = Cesium.createWorldTerrain();

function App() {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.cesiumElement) {
      let viewer = ref.current.cesiumElement;
      const osmBuildings = viewer.scene.primitives.add(
        Cesium.createOsmBuildings()
      );

      const flightData = FlightData;

      const timeStepInSeconds = 30;
      const totalSeconds = timeStepInSeconds * (flightData.length - 1);
      const start = Cesium.JulianDate.fromIso8601("2020-03-09T23:10:00Z");
      const stop = Cesium.JulianDate.addSeconds(
        start,
        totalSeconds,
        new Cesium.JulianDate()
      );
      viewer.clock.startTime = start.clone();
      viewer.clock.stopTime = stop.clone();
      viewer.clock.currentTime = start.clone();
      viewer.timeline.zoomTo(start, stop);
      viewer.clock.multiplier = 50;
      viewer.clock.shouldAnimate = true;

      const positionProperty = new Cesium.SampledPositionProperty();

      for (let i = 0; i < flightData.length; i++) {
        const dataPoint = flightData[i];

        const time = Cesium.JulianDate.addSeconds(
          start,
          i * timeStepInSeconds,
          new Cesium.JulianDate()
        );
        const position = Cesium.Cartesian3.fromDegrees(
          dataPoint.longitude,
          dataPoint.latitude,
          dataPoint.height
        );
        positionProperty.addSample(time, position);

        viewer.entities.add({
          description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.height})`,
          position: position,
          point: { pixelSize: 10, color: Cesium.Color.RED },
        });
      }

      async function loadModel() {
        const airplaneUri = await Cesium.IonResource.fromAssetId(707085);
        const airplaneEntity = viewer.entities.add({
          availability: new Cesium.TimeIntervalCollection([
            new Cesium.TimeInterval({ start: start, stop: stop }),
          ]),
          position: positionProperty,
          model: { uri: airplaneUri },
          orientation: new Cesium.VelocityOrientationProperty(positionProperty),
          path: new Cesium.PathGraphics({ width: 3 }),
        });

        viewer.trackedEntity = airplaneEntity;
      }

      loadModel();
    }
  }, []);

  return <Viewer full ref={ref} terrainProvider={terrainProvider} />;
}

export default App;
