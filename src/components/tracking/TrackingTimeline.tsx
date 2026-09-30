import { SHIPMENT_STAGES, STAGE_LABELS, type ShipmentEvent, type ShipmentStatus } from '../../lib/apiTypes';
import { formatDateTime } from '../../lib/format';
import { CheckIcon } from '../ui/Icons';

/** Vertical milestone timeline: Order Confirmed ↓ … ↓ Delivered. */
export function TrackingTimeline({ status, events }: { status: ShipmentStatus; events: ShipmentEvent[] }) {
  const reachedIndex = SHIPMENT_STAGES.indexOf(status as (typeof SHIPMENT_STAGES)[number]);
  return (
    <ol className="timeline">
      {SHIPMENT_STAGES.map((stage, i) => {
        const ev = events.find((e) => e.stage === stage);
        const state = i < reachedIndex ? 'done' : i === reachedIndex ? (stage === 'DELIVERED' ? 'done' : 'current') : 'todo';
        return (
          <li key={stage} className={`timeline__item is-${state}`}>
            <span className="timeline__dot" aria-hidden>
              {state === 'done' ? <CheckIcon /> : state === 'current' ? <span className="timeline__pulse" /> : null}
            </span>
            <div className="timeline__body">
              <div className="timeline__row">
                <strong>{STAGE_LABELS[stage]}</strong>
                {state === 'current' && <span className="badge badge--blue badge--dot badge--live">Current</span>}
              </div>
              {ev ? (
                <p>
                  <span className="tabular">{formatDateTime(ev.at)}</span> · {ev.location}
                  {ev.note && <em> — {ev.note}</em>}
                </p>
              ) : (
                <p className="timeline__pending">Pending</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
