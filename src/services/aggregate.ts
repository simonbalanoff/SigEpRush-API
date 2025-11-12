import { Rating } from "../models/Rating";
import { PNM } from "../models/PNM";

export async function recomputeAggregate(termId: string, pnmId: string) {
    const rows = await Rating.find({ termId, pnmId, isHidden: false });
    const count = rows.length;
    if (count === 0) {
        await PNM.updateOne({ _id: pnmId }, { $unset: { aggregate: "" } });
        return;
    }
    const sum = rows.reduce((s, r) => s + r.score, 0);
    const avg = Math.round((sum / count) * 10) / 10;
    const dist: Record<number, number> = {};
    for (let i = 0; i <= 10; i++) dist[i] = 0;
    rows.forEach((r) => {
        dist[r.score] = (dist[r.score] || 0) + 1;
    });
    await PNM.updateOne(
        { _id: pnmId },
        {
            $set: {
                aggregate: {
                    avgScore: avg,
                    distScore: dist,
                    countRatings: count,
                    lastRatedAt: new Date(),
                },
            },
        }
    );
}