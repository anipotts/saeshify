import InstrumentClient from "./instrument-client";

export const metadata = {
  title: "instrument - saeshify",
  description: "private spotify playback instrument"
};

export default function InstrumentPage() {
  return <InstrumentClient />;
}

