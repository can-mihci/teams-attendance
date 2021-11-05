import xlsx from "xlsx";
import formidable from "formidable";

export const config = {
	api: {
		bodyParser: false,
	},
};

export default async function handler(req, res) {
	const form = new formidable.IncomingForm();

	try {
		const jsonData = await new Promise(function (resolve, reject) {
			form.parse(req, async (err, fields, files) => {
				if (err) {
					reject(err);
					return;
				}
				try {
					const workbook = xlsx.readFile(files.liste.filepath);
					const sheet = workbook.Sheets[workbook.SheetNames[0]];
					const jsonSheet = xlsx.utils.sheet_to_json(sheet);
					resolve(jsonSheet);
				} catch (err) {
					reject(err);
				}
			});
		});
		return res.status(200).json(jsonData);
	} catch (err) {
		console.error("Error while parsing the form", err);
		return res.status(500).json({ error: err });
	}
}
