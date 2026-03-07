import { useMemo, useState } from "react";
import { BarChart3, DollarSign, MapPin, Shield, Users } from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ComplianceBadge from "@/components/ComplianceBadge";
import { barangayData, barangays } from "@/lib/mockData";

const mapCenter: [number, number] = [14.696, 121.126];

const barangayCoordinates: Record<string, [number, number]> = {
  "Ampid I": [14.724, 121.153],
  "Ampid II": [14.72, 121.146],
  Banaba: [14.697, 121.147],
  "Dulong Bayan I": [14.687, 121.125],
  "Dulong Bayan II": [14.689, 121.13],
  Guinayang: [14.705, 121.101],
  "Guitnang Bayan I": [14.683, 121.118],
  "Guitnang Bayan II": [14.685, 121.121],
  "Gulod Malaya": [14.708, 121.134],
  Malanday: [14.678, 121.102],
  Maly: [14.676, 121.11],
  "Pintong Bocaue": [14.671, 121.119],
  "San Jose": [14.69, 121.139],
  "San Rafael": [14.668, 121.097],
  "Santa Ana": [14.667, 121.107],
  "Santo Nino": [14.674, 121.115],
};

const baseMarkerIcon = new L.Icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const statusMarkerIcon = (status: "compliant" | "pending" | "overdue") => {
  const color =
    status === "overdue" ? "#ef4444" : status === "pending" ? "#f59e0b" : "#1B4F72";

  return L.divIcon({
    className: "status-marker-wrapper",
    html: `
      <div style="position: relative; width: 24px; height: 36px;">
        <img src="${markerIcon}" style="width:24px;height:36px;display:block;filter:grayscale(100%);" />
        <div style="position:absolute;left:6px;top:6px;width:12px;height:12px;border-radius:9999px;background:${color};border:2px solid #ffffff;box-shadow:0 1px 2px rgba(0,0,0,.25);"></div>
      </div>
    `,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [1, -28],
  });
};

const statusMarkerColor = (status: "compliant" | "pending" | "overdue") => {
  if (status === "overdue") return "text-destructive";
  if (status === "pending") return "text-warning";
  return "text-primary";
};

export default function BarangayMap() {
  const [selected, setSelected] = useState<string | null>(null);
  const data = selected ? barangayData[selected] : null;

  const markerItems = useMemo(
    () =>
      barangays.map((name) => ({
        name,
        coords: barangayCoordinates[name] ?? mapCenter,
        status: barangayData[name].complianceStatus,
      })),
    [],
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="hero-gradient py-12">
          <div className="container">
            <h1 className="text-2xl md:text-4xl font-bold text-secondary-foreground">Barangay Map</h1>
            <p className="text-secondary-foreground/70 mt-2 max-w-xl text-sm">
              Click any marker to view youth population, budget utilization, activities, and compliance status.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg border p-4 card-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="font-heading font-semibold">Interactive Barangay Map</h2>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Compliant</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" />Pending</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />Overdue</span>
                  </div>
                </div>

                <div className="h-[460px] w-full rounded-lg overflow-hidden border">
                  <MapContainer center={mapCenter} zoom={13} scrollWheelZoom className="h-full w-full">
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {markerItems.map((item) => (
                      <Marker
                        key={item.name}
                        position={item.coords}
                        icon={statusMarkerIcon(item.status) ?? baseMarkerIcon}
                        eventHandlers={{ click: () => setSelected(item.name) }}
                      >
                        <Popup>
                          <div className="text-sm">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-muted-foreground">Youth: {barangayData[item.name].youthPopulation.toLocaleString()}</p>
                            <p className={statusMarkerColor(item.status)}>Status: {item.status}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </div>
            </div>

            <div>
              {data && selected ? (
                <div className="bg-card rounded-lg border p-6 card-shadow animate-fade-up">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold text-lg">{selected}</h3>
                    <ComplianceBadge status={data.complianceStatus} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Youth Population</p>
                        <p className="font-semibold">{data.youthPopulation.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <DollarSign className="h-4 w-4 text-accent" />
                      <div>
                        <p className="text-xs text-muted-foreground">SK Budget</p>
                        <p className="font-semibold">PHP {data.skBudget.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Utilized: PHP {data.utilizedBudget.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Activities and Participants</p>
                        <p className="font-semibold">{data.activities} activities, {data.participants.toLocaleString()} participants</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Shield className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">SK Chairperson</p>
                        <p className="font-semibold">{data.skChairperson}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card rounded-lg border p-8 card-shadow text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground text-sm">Click a marker to view barangay details</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
