import { createFileRoute } from "@tanstack/react-router";
import { Caret } from "~/components/ui/Icons";
import { useBearStore } from "~/utils/zustand";

export const Route = createFileRoute(
  "/_pathlessLayout/_nested-layout/rules-id"
)({
  component: LayoutAComponent,
});

function LayoutAComponent() {
  const { rulesConfig } = useBearStore();
  const { topN, totalPool, minPayout, minMods, vector } = rulesConfig;

  return (
    <div className="prose dark:prose-invert flex flex-col gap-4">
      <details open className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">Umum</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>Kontes mingguan, waktunya sama seperti Warpcast Rewards</li>
            <li>
              <strong>{topN}</strong> cast SassyHash paling menarik akan berbagi
              hadiah <strong>${totalPool}</strong>
            </li>
            <li>
              Satu pengguna bisa menang lebih dari satu kali dalam seminggu
            </li>
            <li>
              Mau farming atau coba trik? Silakan! Justru bisa dapat hadiah
              juga.
              <br />
              Semua proses transparan, kita belajar bareng{" "}
            </li>
            <li>
              Anti-kolusi pakai sistem "decentralized retroactive delegation"
            </li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">
            💲🎩🌯 Pembayaran
          </span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>
              Minimal payout <strong>${minPayout}</strong> per FID di
              Leaderboard
            </li>
            <li>
              Dibayar ke alamat Ethereum terakhir yang terverifikasi (biasanya
              Warpcast Wallet). Pembagian hadiah:
            </li>
            <ul>
              <li>60% dalam $USDC di Base</li>
              <li>30% dalam $DEGEN di Degen L3</li>
              <li>10% dalam $BURRITO di Base</li>
            </ul>
            <li>
              Maksimal payout <strong>${totalPool}</strong> (kalau semua cast
              kamu masuk Top {topN})
            </li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">Anti-Farmer 🕵️‍♀️</span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>
              Setiap cast harus dapat minimal likes dari SassyMods 💁‍♀️ /
              Sassquatch 🦧 agar dihitung
            </li>
            <li>
              Minimum: <strong>{minMods}</strong>, bisa naik kalau perlu
            </li>
            <li>Nggak ada satu moderator yang punya pengaruh besar</li>
            <li>
              Moderator boleh aja terima suap atau kerja sama, tapi bisa
              ketahuan dan dikeluarkan
            </li>
            <li>Nggak ada veto, semua cinta damai</li>
          </ul>
        </div>
      </details>
      <details className="group w-full">
        <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
          <span className="text-lg sm:text-xl font-bold">
            📊 Buat yang Suka Data
          </span>
          <Caret />
        </summary>
        <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
          <ul>
            <li>Skor mentah setiap cast adalah jumlah: </li>
            <ul>
              <li>views x <strong>{vector.views.toLocaleString()}</strong></li>
              <li>like dari SassyMods: x <strong>{vector.likes.toLocaleString()}</strong></li>
              <li>
                balasan dari user lain yang dapat like dari caster asli: x{" "}
                <strong>{vector.replies.toLocaleString()}</strong>
              </li>
            </ul>
            <li>Skor dihaluskan = Z'(arctan(Z(Skor mentah))) 🤓</li>
            <ul>
              <li>Ambil nilai ekstrim, geser ke tengah</li>
              <li>
                Lebih menghargai konsistensi daripada cuma satu cast yang
                meledak
              </li>
            </ul>
            <li>
              Setiap FID unik di leaderboard dapat jatah{" "}
              <strong>${minPayout}</strong>
            </li>
            <li>
              <strong>Sisa hadiah</strong> dibagi berdasarkan skor yang sudah
              dihaluskan
            </li>
          </ul>
        </div>

        <details open className="group w-full">
          <summary className="flex w-full cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-900">
            <span className="text-lg sm:text-xl font-bold">
              Apa itu $BURRITO?
            </span>
            <Caret />
          </summary>
          <div className="prose dark:prose-invert prose-neutral mt-4 px-3 pb-4 max-w-none">
            <ul>
              <li>
                🌯 BURROTI adalah [
                <a
                  href="https://www.clanker.world/clanker/0x097745F2FB83C104543F93E528B455FC3cE392b6"
                  target="_blank"
                  rel="noreferrer"
                >
                  clanker v0
                </a>
                ] dan Fan Token pribadi saya.
              </li>
              <li>CA: 0x097745F2FB83C104543F93E528B455FC3cE392b6 [Base]</li>
              <li>
                Saya nggak dapat token saat peluncuran, tapi saya trading lawan
                snipers buat dapetin bagian saya. Semua fee trading saya pakai
                buat beli lebih banyak token di market.
              </li>
              <li>
                Kamu bebas swap token ini atau lakukan apa pun yang kamu mau.
                Saya bakal tetap beli di market setiap kali membagikan token.
              </li>
            </ul>
          </div>
        </details>
      </details>
    </div>
  );
}
