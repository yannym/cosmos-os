import { TelemetryData } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FlightTelemetryProps {
  data: TelemetryData[];
}

export const FlightTelemetry = ({ data }: FlightTelemetryProps) => {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.time).toLocaleTimeString(),
  }));

  return (
    <div className="h-40 w-full bg-black/50 border border-current p-2">
      <h3 className="text-[10px] uppercase tracking-widest text-current mb-2">
        Flight Telemetry
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: "#000", border: "1px solid #333" }}
            itemStyle={{ fontSize: "10px" }}
          />
          <Line
            type="monotone"
            dataKey="fuel"
            stroke="#ffb000"
            strokeWidth={1}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="hull"
            stroke="#33ff33"
            strokeWidth={1}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="heat"
            stroke="#ff5500"
            strokeWidth={1}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
