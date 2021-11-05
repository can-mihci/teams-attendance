import classes from "../styles/Home.module.css";
import { useState, useRef } from "react";
import axios from "axios";
import {
	Container,
	Row,
	Col,
	Table,
	InputGroup,
	FormControl,
	Button,
} from "react-bootstrap";
import ReactTooltip from "react-tooltip";

export default function Home() {
	let initialWeekStateObj = {};
	for (let i = 0; i < 14; i++) {
		initialWeekStateObj[i] = false;
	}

	let initialAttendanceObject = {};
	for (let i = 0; i < 14; i++) {
		initialAttendanceObject[`week${i + 1}`] = null;
	}

	const weeks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
	const [weekStateObj, setWeekStateObj] = useState(initialWeekStateObj);
	const [isSelected, setIsSelected] = useState(false);
	const [classList, setClassList] = useState([]);
	const [minDuration, setMinDuration] = useState(null);
	const [courseName, setCourseName] = useState(null);
	const [attendance, setAttendance] = useState(initialAttendanceObject);

	function changeHandler(e) {
		setIsSelected(true);
		const toUpload = new FormData();
		toUpload.append("liste", e.target.files[0]);
		axios
			.post("/api/parse_list", toUpload)
			.then((res) => {
				//console.log(res.data);
				const formattedList = res.data.map((entry) => ({
					isim: `${entry["First Name"]} ${
						entry["Last Name"] ? entry["Last Name"] : ""
					}`,
					email: entry["Email Address"],
				}));
				setClassList(formattedList);
			})
			.catch((error) => {
				console.log(error);
			});
	}

	function weekHandler(e) {
		function convertToSeconds(durationString) {
			const splitted_string = durationString.trim().split(" ");
			const multiColumn = splitted_string.length > 1;
			if (!multiColumn) {
				if (durationString.slice(durationString[0].length - 1) === "s") {
					return Number(durationString.match(/\d+/g)[0]);
				}
				if (durationString.slice(durationString[0].length - 1) === "m") {
					return Number(durationString.match(/\d+/g)[0]) * 60;
				}
				return Number(durationString.match(/\d+/g)[0]) * 3600;
			}
			if (splitted_string[0].slice(splitted_string[0].length - 1) === "m") {
				return (
					Number(splitted_string[0].match(/\d+/g)[0]) * 60 +
					Number(splitted_string[1].match(/\d+/g)[0])
				);
			}
			return (
				Number(splitted_string[0].match(/\d+/g)[0]) * 3600 +
				Number(splitted_string[1].match(/\d+/g)[0]) * 60
			);
		}

		const weekId = e.target.dataset.id - 1;
		let weekStateObjCopy = { ...weekStateObj };
		weekStateObjCopy[weekId] = true;
		setWeekStateObj(weekStateObjCopy);
		const toUpload = new FormData();
		toUpload.append("week", e.target.files[0]);
		axios
			.post("/api/parse_week", toUpload)
			.then((res) => {
				const raw_list = res.data.slice(6);
				const mapped_list = raw_list.map((entry) => {
					return {
						email: entry["__EMPTY_3"],
						duration: convertToSeconds(entry["__EMPTY_2"]),
					};
				});
				let helper = {};
				let result = mapped_list.reduce(function (r, o) {
					let key = o.email;

					if (!helper[key]) {
						helper[key] = Object.assign({}, o); // create a copy of o
						r.push(helper[key]);
					} else {
						helper[key].duration += o.duration;
					}

					return r;
				}, []);

				let attendanceCopy = { ...attendance };
				attendanceCopy[`week${weekId + 1}`] = result;
				setAttendance(attendanceCopy);
			})
			.catch((error) => {
				console.log(error);
			});
	}

	const minDurationRef = useRef();
	const courseNameRef = useRef();

	function setDurationHandler(e) {
		if (!minDuration) {
			const minutesInput = minDurationRef.current.valueAsNumber;
			setMinDuration(minutesInput * 60);
		} else {
			setMinDuration(null);
			minDurationRef.current.value = "";
		}
	}

	function setCourseNameHandler(e) {
		if (!courseName) {
			const courseNameInput = courseNameRef.current.value;
			setCourseName(courseNameInput);
		} else {
			setCourseName(null);
			courseNameRef.current.value = "";
		}
	}

	function searchStudentInWeek(email, week) {
		const currentWeekAttendance = attendance[`week${week + 1}`];
		if (currentWeekAttendance) {
			console.log(currentWeekAttendance);
			const studentEntryExists = currentWeekAttendance.find(
				(element) => element.email === email && element.duration > minDuration
			);
			return studentEntryExists ? <td key={`${email.split("@")[0]}-${currentWeekAttendance}`} className={classes.present}>✔</td> : <td key={`${email.split("@")[0]}-${currentWeekAttendance}`} className={classes.absent}>✖</td>;
		}
		return null;
	}

	return (
		<main>
			<Container className={classes["main-container"]}>
				<h1>Teams Yoklama Kontrol Yazılımı</h1>
				{isSelected ? (
					""
				) : (
					<Row>
						<div className={classes["file-input-trickery"]}>
							Sınıf Listesini&nbsp;
							<label className="btn btn-primary btn-sm" htmlFor="liste">
								Yükle..
							</label>
						</div>
						<input
							className={classes["file-input"]}
							type="file"
							id="liste"
							name="liste"
							accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
							onChange={changeHandler}
						></input>
					</Row>
				)}

				<Row>
					{classList.length ? (
						<div>
							<Row>
								<Col md={true}>
									<InputGroup className="mb-3">
										<InputGroup.Text
											id="minutes"
											className={classes["first-label"]}
										>
											Min. süre (dk):
											<a
												className={classes["tooltip-trigger"]}
												data-tip="React-tooltip"
											>
												?
											</a>
										</InputGroup.Text>
										<ReactTooltip
											className={classes["tooltip-opacity"]}
											place="right"
											type="info"
											effect="solid"
										>
											<div className={classes["tooltip-width"]}>
												Öğrencinin devamsız sayılmaması için o haftaki derste
												geçirmiş olması gereken minimum toplam süreyi, dakika
												cinsinden giriniz. Bu sayede, örneğin, her hafta derse
												gelen ama derste yalnızca toplam 1-2 dakika durup çıkan
												öğrenciler devamsız kabul edilecektir.
											</div>
										</ReactTooltip>
										<FormControl
											type="number"
											placeholder="Dakika değeri giriniz"
											aria-label="Dakika değeri giriniz"
											aria-describedby="minutes"
											disabled={!!minDuration}
											ref={minDurationRef}
										/>
										<Button
											variant={minDuration ? "secondary" : "primary"}
											onClick={setDurationHandler}
										>
											{minDuration ? "Tekrar ayarla?" : "Ayarla.."}
										</Button>
									</InputGroup>
									<InputGroup className="mb-3">
										<InputGroup.Text className={classes["first-label"]}>
											Ders Adı
										</InputGroup.Text>
										<FormControl
											placeholder="Dersin adını giriniz"
											aria-label="Dersin adını giriniz"
											disabled={!!courseName}
											ref={courseNameRef}
										/>
										<Button
											variant={courseName ? "secondary" : "primary"}
											onClick={setCourseNameHandler}
										>
											{courseName ? "Düzelt?" : "Kaydet.."}
										</Button>
									</InputGroup>
								</Col>
								<Col md={true}></Col>
							</Row>
							<div>
								<Table striped bordered hover className={classes["table-body"]}>
									<thead>
										<tr>
											<th>#</th>
											<th>İsim</th>
											<th>E-Posta</th>
											{weeks.map((week) => (
												<th className={classes["table-head"]} key={week + 1}>
													<div className={classes["justified"]}>
														{weekStateObj[week] ? (
															`${week + 1}`
														) : (
															<div>
																<label
																	className={`btn btn-sm ${
																		courseName && minDuration
																			? "btn-primary"
																			: "btn-secondary"
																	}`}
																	htmlFor={`${week + 1}-hafta`}
																>
																	{week + 1}..
																</label>
																<input
																	className={classes["file-input"]}
																	type="file"
																	id={`${week + 1}-hafta`}
																	name={`${week + 1}-hafta`}
																	data-id={week + 1}
																	accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
																	onChange={weekHandler}
																	disabled={!(courseName && minDuration)}
																></input>
															</div>
														)}
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{classList.map((entry, index) => (
											<tr key={index}>
												<td>{index + 1}</td>
												<td>{entry.isim}</td>
												<td>{entry.email}</td>
												{weeks.map((week) =>
													searchStudentInWeek(entry.email, week)
												)}
											</tr>
										))}
									</tbody>
								</Table>
							</div>
						</div>
					) : (
						""
					)}
				</Row>
			</Container>
		</main>
	);
}
