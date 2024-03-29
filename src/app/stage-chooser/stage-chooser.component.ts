import { Component, OnInit } from "@angular/core";
import { MdcSnackbarService, MdcDialogDirective } from "@blox/material";
import { FetchService } from "../fetch.service";
import { Router } from "@angular/router";
import { doesNotMatch } from "assert";
import { element } from "protractor";
import { ITS_JUST_ANGULAR } from "@angular/core/src/r3_symbols";
import { isFormattedError } from "@angular/compiler";
interface StageList {
  preset: {
    [presetName: string]: Array<string>;
  };
  allStage?: string[];
  ActivityName?: {
    [StageCode: string]: string;
  };
}
@Component({
  selector: "app-stage-chooser",
  templateUrl: "./stage-chooser.component.html",
  styleUrls: ["./stage-chooser.component.scss"]
})
export class StageChooserComponent implements OnInit {
  constructor(
    private fetchService: FetchService,
    private snackbar: MdcSnackbarService,
    private router: Router
  ) { }
  stageList: StageList = { preset: { zh_CN: [] } };
  get presets(){
    return Object.keys(this.stageList.preset).filter(
      v => v != "default"
    );
  }
  choicePreset = "";
  willRenderStage: {
    Main: [string, boolean][][];
    Activity: {
      [ActivityName: string]: [string, boolean][];
    };
  } = {
      Main: [], // 主线
      Activity: {} //活动
    };
  exportOrimporting = false;
  get exportedData() {
    let Data = {};
    let DeletePreset = ["zh_CN", "en_US", "ja_JP", "ko_KR", "default"]
    let TempData = Object.entries(this.stageList.preset).filter(v => !DeletePreset.includes(v[0]));
    for (let [k, v] of TempData) {
      Data[k] = v;
    }
    return JSON.stringify(Data);
  }
  importedData = '';
  SavePresetName="";
  AllStageList: [string, boolean][] = [];
  ngOnInit() {
    this.stageList = this.fetchService.getLocalStorage("stageList", {
      preset: { zh_CN: [] }
    });
    this.updateStage();
  }
  reset() {
    let Data = {};
    let DeletePreset = ["zh_CN", "en_US", "ja_JP", "ko_KR", "default"];
    let TempData = Object.entries(this.stageList.preset).filter(v => DeletePreset.includes(v[0]));
    for (let [k, v] of TempData) {
      Data[k] = v;
    }
    this.stageList.preset = Data;
    this.saveStorage();
  }
  get exclude() {
    return this.AllStageList.filter(v => !v[1]).map(v => v[0]);
  }
  getImportedData() {
    const data = JSON.parse(this.importedData);
    this.stageList.preset = Object.assign({}, this.stageList.preset, data);
    this.saveStorage();
    this.snackbar.show({
      message: '导入成功。',
      actionText: '好的',
      multiline: false,
      actionOnBottom: false
    });
  }
  async copyExport() {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(this.exportedData);
        this.snackbar.show({
          message: '已复制到剪切板。',
          actionText: '好的',
          multiline: false,
          actionOnBottom: false
        });
      } catch (err) {
        this.snackbar.show({
          message: '复制失败。',
          actionText: '好吧',
          multiline: false,
          actionOnBottom: false
        });
      }
    }
  }
  updateStage() {
    this.fetchService
      .getVersionData("StageList.json")
      .subscribe((stageList: StageList) => {
        this.stageList["allStage"] = stageList["allStage"];
        this.stageList = Object.assign(this.stageList,stageList);
        if (!this.stageList.preset.default)
          this.stageList.preset.default = this.stageList.preset["zh_CN"];
        this.fetchService.setLocalStorage("stageList", this.stageList);
        this.initData();
      });
  }
  initData() {
    this.willRenderStage = {
      Main: [], // 主线
      Activity: {} //活动
    };
    this.AllStageList = [];
    let RenderList = this.stageList.preset["zh_CN"];
    for (let Stage of RenderList) {
      const StageIndex = this.AllStageList.push([Stage, this.stageList.preset.default.includes(Stage)]) - 1;
      let StageCode = Stage.split("-")[0];
      if (/S?\d+/.test(StageCode)) {
        //主线/支线关卡
        let Zone = /S?(\d+)/.exec(StageCode)[1];
        if (typeof this.willRenderStage.Main[Zone] == "undefined") {
          this.willRenderStage.Main[Zone] = [];
        }
        this.willRenderStage.Main[Zone].splice(
          this.FindinsertStageIndex(this.willRenderStage.Main[Zone], Stage),
          0,
          this.AllStageList[StageIndex]
        ); //浅拷贝
      } else {
        //活动关卡
        if (
          typeof this.willRenderStage.Activity[
          this.stageList["ActivityName"][StageCode]
          ] == "undefined"
        ) {
          this.willRenderStage.Activity[
            this.stageList["ActivityName"][StageCode]
          ] = [];
        }
        this.willRenderStage.Activity[
          this.stageList["ActivityName"][StageCode]
        ].splice(
          this.FindinsertStageIndex(
            this.willRenderStage.Activity[
            this.stageList["ActivityName"][StageCode]
            ],
            Stage
          ),
          0,
          this.AllStageList[StageIndex]
        ); //浅拷贝
      }
    }
  }
  savePreset() {
    let PresetName = this.SavePresetName;
    this.stageList.preset[PresetName] = this.stageList.preset.default;
    this.fetchService.setLocalStorage("stageList", this.stageList);
  }
  FindinsertStageIndex(dest: [string, boolean][], Stage: string) {
    // 二分法查找插入关卡位置
    let Start: number;
    let End: number;
    if (dest.length == 0) return 0;
    if (this.willRenderStage.Main.includes(dest)) {
      if (Stage[0] == "S") {
        Start = dest.findIndex(v => v[0][0] == "S");
        End = dest.length - 1;
        if (Start < 0) return dest.length;
      } else {
        Start = 0;
        End = dest.findIndex(v => v[0][0] == "S") - 1;
        if (End < 0) End = dest.length - 1;
      }
    } else {
      Start = 0;
      End = dest.length - 1;
    }
    let FindNum = Number(Stage.split("-")[1]);
    while (Start <= End) {
      let Mid = Start + ((End - Start) >> 1);
      if (Number(dest[Mid][0].split("-")[1]) < FindNum) {
        Start = Mid + 1;
      } else if (Number(dest[Mid][0].split("-")[1]) > FindNum) {
        End = Mid - 1;
      } else {
        return Mid;
      }
    }
    return Start;
  }
  change(e: { target: { checked: boolean; }; }, dest: [string, boolean]) {
    dest[1] = e.target.checked;
    this.saveStorage();
  }
  saveStorage() {
    this.stageList.preset.default = this.AllStageList.filter(v => v[1]).map(v => v[0]);
    this.fetchService.setLocalStorage("stageList", this.stageList);
  }
  choiceAll(dest = this.AllStageList) {
    for (let item of dest) {
      item[1] = true;
    }
    this.saveStorage();
  }
  invert(dest = this.AllStageList) {
    for (let item of dest) {
      item[1] = !item[1];
    }
    this.saveStorage();
  }
  loadPreset() {
    if (this.choicePreset == "") return;
    this.stageList.preset.default = this.stageList.preset[this.choicePreset];
    //this.initData();
    for (let Stage of this.AllStageList) {
      Stage[1] = this.stageList.preset.default.includes(Stage[0]);
    }
    this.fetchService.setLocalStorage("stageList", this.stageList);
  }
}
