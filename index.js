//-- Modify thoes path
const ProjectPath = "";
const ExportLocalizationPath = "";
//---------------------

const fs = require("fs");
const ini = require("ini");
const path = require("path");
const UTF8_BOM = "\u{FEFF}";

let rowKeys = [];
let rows = {};
let cultures = [];

const TimeMark = () => {
  const date = new Date();

  let yy = new Intl.DateTimeFormat("en", { year: "2-digit" }).format(date);
  let MM = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(date);
  let dd = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date);
  let hh = new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hour12: false,
  }).format(date);
  let mm = new Intl.DateTimeFormat("en", { minute: "numeric" }).format(date);
  return `${yy}${MM}${dd}${hh}${mm}`;
};

const getPath = (relativePath, basePath = ProjectPath) => {
  return path.join(basePath, relativePath);
};

const localizationIni = ini.parse(
  fs.readFileSync(getPath("/Config/Localization/Game_Gather.ini"), "utf8")
);

const generateBaseTable = () => {
  const str = fs
    .readFileSync(
      getPath(
        path.join(
          localizationIni.CommonSettings.SourcePath,
          localizationIni.CommonSettings.ManifestName
        )
      ),
      "utf16le"
    )
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .replace(/\t/g, "")
    .replace(/\s/g, "");

  const data = JSON.parse(str);

  data.Children.forEach((item) => {
    item.Keys.forEach((keyInfo) => {
      rowKeys.push(keyInfo.Key);
      rows[keyInfo.Key] = {
        key: keyInfo.Key,
        path: keyInfo.Path,
        source: item.Source.Text,
      };
    });
  });
};

const generateCulture = (lan) => {
  const file = getPath(
    path.join(localizationIni.CommonSettings.SourcePath, lan, "Game.archive")
  );
  const str = fs
    .readFileSync(file, "utf16le")
    .replace(/\n/g, "")
    .replace(/\r/g, "")
    .replace(/\t/g, "")
    .replace(/\s/g, "");
  const data = JSON.parse(str);

  data.Children.forEach((item) => {
    rows[item.Key] = {
      [lan]: item.Translation.Text,
      ...rows[item.Key],
    };
  });
};

const generateCultures = () => {
  const dir = getPath(localizationIni.CommonSettings.SourcePath);
  const arr = fs.readdirSync(dir);
  cultures = arr.filter((item) => {
    const stat = fs.statSync(path.join(dir, item));
    return stat.isDirectory();
  });

  cultures.forEach((c) => {
    generateCulture(c);
  });
};

const exportCsv = () => {
  let content = "";
  let needsCols = ["key", "source"].concat(cultures);
  content = needsCols.join(",") + "\n";
  rowKeys.forEach((rowKey) => {
    // @fix: translation text has ,
    const rowData = needsCols.map((col) => `"${rows[rowKey][col]}"` || " ");
    content += rowData.join(",") + "\n";
  });

  fs.writeFileSync(
    path.join(ExportLocalizationPath, `Trans.${TimeMark()}.csv`),
    content,
    "utf8"
  );
};

generateBaseTable();
generateCultures();
exportCsv();
