import { CalEvent } from "./CalEvent";
import { PredictionEvent } from "./PredictionEvent";

export class CalendarEventInfo {
  public events: CalEvent[] = [];
  public predictions: PredictionEvent[] = [];
}
