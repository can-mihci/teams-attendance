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

  const weeks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const [isSelected, setIsSelected] = useState(false);
  const [classroom, setClassroom] = useState({});
	const [minDuration, setMinDuration] = useState(null);
	const [minAttendance, setMinAttendance] = useState(null);
  const [courseName, setCourseName] = useState(null);

  function changeHandler(e) {
    setIsSelected(true);
    const toUpload = new FormData();
    toUpload.append("liste", e.target.files[0]);
    axios
      .post("/api/parse_list", toUpload)
      .then((res) => {
        console.log(res.data);
        let classroomCopy = {};

        res.data.forEach((studentEntry) => {
          classroomCopy[studentEntry["Email Address"]] = {
            isim: `${studentEntry["First Name"]} ${
              studentEntry["Last Name"] ? studentEntry["Last Name"] : ""
            }`,
          };
        });
        setClassroom(classroomCopy);
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
        if (durationString.slice(durationString.length - 1) === "s") {
          return Number(durationString.match(/\d+/g)[0]);
        }
        if (durationString.slice(durationString.length - 1) === "m") {
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
        console.log(result);
        const classroomCopy = { ...classroom };
        Object.keys(classroom).forEach((studentEmail) => {
          if (classroomCopy[studentEmail]) {
            const existingStudent = result.find(
              (entry) => studentEmail === entry.email
            );
            if (!existingStudent || existingStudent.duration < minDuration) {
              classroomCopy[studentEmail][`week${weekId + 1}`] = 1;
            } else {
              classroomCopy[studentEmail][`week${weekId + 1}`] = 0;
            }
          }
        });
        setClassroom(classroomCopy)
      })
      .catch((error) => {
        console.log(error);
      });
  }

  const minDurationRef = useRef();
	const courseNameRef = useRef();
	const minAttendanceRef = useRef();

  function setDurationHandler(e) {
    if (!minDuration) {
      const minutesInput = minDurationRef.current.valueAsNumber;
      setMinDuration(minutesInput * 60);
    } else {
      setMinDuration(null);
      minDurationRef.current.value = "";
    }
  }

  function setMinAttendanceHandler(e) {
    if (!minAttendance) {
      const minAttendanceValue = minAttendanceRef.current.valueAsNumber;
      setMinAttendance(minAttendanceValue);
    } else {
      setMinAttendance(null);
      minAttendanceRef.current.value = "";
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
          {Object.keys(classroom).length ? (
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
                    <InputGroup.Text
                      id="numtimes"
                      className={classes["first-label"]}
                    >
                      Devamsızlık Hakkı
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
                        Öğrencinin devamsızlıktan kalması için derse en fazla bu kadar hafta kadar devamsızlık yapma hakkı bulunur.
                      </div>
                    </ReactTooltip>
                    <FormControl
                      type="number"
                      placeholder="Hafta değeri giriniz"
                      aria-label="Hafta değeri giriniz"
                      aria-describedby="numtimes"
                      disabled={!!minAttendance}
                      ref={minAttendanceRef}
                    />
                    <Button
                      variant={minAttendance ? "secondary" : "primary"}
                      onClick={setMinAttendanceHandler}
                    >
                      {minAttendance ? "Tekrar ayarla?" : "Ayarla.."}
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
                                  disabled={!(courseName && minDuration && minAttendance)}
                                ></input>
                              </div>
                            
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(classroom).map((studentEmail, index) => {
                      return (
                        <tr key={index} className={
													Object.values(classroom[studentEmail]).filter(value => typeof(value) === "number").reduce((a, b) => { return a + b}, 0) > minAttendance ? classes["absent-row"] : ""
												}>
                          <td>{index + 1}</td>
                          <td>{classroom[studentEmail].isim}</td>
                          <td>{studentEmail}</td>
                          {weeks.map((weekNumber, otherIndex) => {
														let weekExistsContent = "";
														const unattendance = classroom[studentEmail][`week${weekNumber + 1}`] === 1
                            const weekExists = classroom[studentEmail][`week${weekNumber + 1}`] !== undefined;
                            if (weekExists) {
                              weekExistsContent = (unattendance ? "✖" : "✔");
                            }
                            return <td key={`week${otherIndex}`} className={weekExists ? (unattendance ? classes.absent : classes.present): ""}>{weekExists ? weekExistsContent : ""}</td>;
                          })}
                        </tr>
                      );
                    })}
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
