// api/cek-lulus.js
export default async function handler(req, res) {
    const { keyword } = req.query; // Mengambil NIS/NISN yang diketik siswa
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // MENGAMBIL DARI BRANKAS VERCEL

    if (!keyword) {
        return res.status(400).json({ error: "NIS/NISN diperlukan" });
    }

    try {
        // Mengambil data dari Google Sheets (hanya Range A11:H agar efisien)
        const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&range=A11:H`;
        const response = await fetch(url);
        const text = await response.text();

        const jsonString = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const json = JSON.parse(jsonString);

        // Cari data siswa yang cocok
        const rows = json.table.rows;
        const siswa = rows.find(row => {
            const nis = row.c[2] ? String(row.c[2].v).toLowerCase() : "";
            const nisn = row.c[3] ? String(row.c[3].v).toLowerCase() : "";
            return nis === keyword.toLowerCase() || nisn === keyword.toLowerCase();
        });

        if (siswa) {
            // HANYA mengirimkan data 1 siswa ini saja ke browser (AMAN!)
            return res.status(200).json({
                nama: siswa.c[1]?.v || "",
                nis: siswa.c[2]?.v || "",
                nisn: siswa.c[3]?.v || "",
                kelas: siswa.c[5]?.v || "-",
                nilai: typeof siswa.c[6]?.v === 'number' ? Math.round(siswa.c[6].v * 100) / 100 : (siswa.c[6]?.v || "-"),
                status: siswa.c[7]?.v || ""
            });
        } else {
            return res.status(404).json({ error: "Data tidak ditemukan" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Gagal mengambil data dari Google Sheets" });
    }
}
