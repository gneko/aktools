import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { MdcSnackbarService, MdcDialogDirective } from "@blox/material";
import { FetchService } from "../fetch.service";
import { Router } from "@angular/router";
import * as echarts from 'echarts/lib/echarts';
import "echarts/lib/chart/line"
import "echarts/lib/component/title";
interface SourceHashList {
  id?: string;
  name?: string;
  version?: number;
  hash: number[] | /* version 1 */ number[][] /* version 2 */;
  count?: number;
}
@Component({
  selector: "app-detect-setting",
  templateUrl: "./detect-setting.component.html",
  styleUrls: ["./detect-setting.component.scss"],
})
export class DetectSetttingComponent implements OnInit {
  // tslint:disable: all
  ImageElement: HTMLImageElement;
  ImageLoaded: boolean;
  Canvas: HTMLCanvasElement;
  Ctx: CanvasRenderingContext2D;
  ImageData: ImageData;
  worker: Worker;
  InfoText: "等待处理";
  progress: 0;
  XBound = [];
  YBound = [];
  ItemImages = [];
  ItemImage: string = "";
  NumberImages = [];
  textColor: any;
  MaxFontSize: any;
  FontSize = 0;
  ModifyingItem = null;
  ModifyBuffer: any = { have: 0, delete: false };
  Modifying = { x: 0, y: 0 };
  ItemNames: Object;
  detectedItem = [];
  Lock = false;
  ItemHashList: SourceHashList[] = [];
  RecordItemHash: {
    [id: string]: {
      id?: string;
      name?: string;
      version?: number;
      hash: number[] | /* version 1 */ number[][] /* version 2 */;
      count?: number;
    };
  } = {};
  OriginHash: any = [];
  ImageDatas: any[];
  hashCompareCanvas: HTMLCanvasElement;
  hashCompareChart: echarts.ECharts;
  constructor(
    private fetchService: FetchService,
    private snackbar: MdcSnackbarService,
    private router: Router,
    private el: ElementRef,
  ) { }

  async ngOnInit() {
    this.fetchService.getVersionData("material.json").subscribe((data) => {
      this.ItemNames = { "0000": "该位置无物品" };
      for (const i in data) {
        if (data[i]) {
          this.ItemNames[data[i].id] = data[i].name;
        }
      }
      this.registerWorker();
    });
    this.ImageElement = document.createElement("img");
    this.Canvas = this.el.nativeElement.querySelector("#MainCanvas");
    this.hashCompareCanvas = document.createElement("canvas");
    this.Ctx = this.Canvas.getContext("2d");
    this.hashCompareCanvas.width = 1152;
    this.hashCompareCanvas.height = 220;
    this.MaxFontSize = this.fetchService.getLocalStorage("detect-mfs", true);
    this.textColor = this.fetchService.getLocalStorage(
      "detect-tclr",
      "#00ff00"
    );
    this.onPasteImage();
  }
  Copy(input) {
    input.select();
    if (document.execCommand("copy")) {
      this.snackbar.show({
        message: "复制成功",
        actionText: "好的",
        multiline: false,
        actionOnBottom: false,
      });
    }
  }
  Import(input) {
    localStorage.setItem("detect-setting", input.value);
    this.ItemHashList =
      JSON.parse(localStorage.getItem("detect-setting")) ||
      Boolean(
        localStorage.setItem(
          "detect-setting",
          JSON.stringify(this.ItemHashList)
        )
      ) ||
      this.ItemHashList;
    this.ImageDatas.length == 0 ? this.resetAll() : this.EditGuiReset();
    this.snackbar.show({
      message: "导入成功",
      actionText: "好的",
      multiline: false,
      actionOnBottom: false,
    });
  }
  choiceImage(event) {
    const ImageContainer = event.target;
    const Reader = new FileReader();
    Reader.onload = (e) => {
      this.LoadImage(Reader.result.toString());
    };
    Reader.readAsDataURL(ImageContainer.files[0]);
  }
  onPasteImage() {
    document.addEventListener("paste", (event) => {
      const items = event.clipboardData && event.clipboardData.items;
      if (items && items.length) {
        if (items[0].type.indexOf("image") !== -1) {
          const file = items[0].getAsFile();
          const Reader = new FileReader();
          Reader.onload = (e) => {
            this.LoadImage(Reader.result.toString());
          };
          Reader.readAsDataURL(file);
        }
      }
    });
  }
  LoadImage(src: string) {
    this.ImageElement.onload = (e) => {
      this.ImageLoaded = true;
      this.Canvas.width = this.ImageElement.width;
      this.Canvas.height = this.ImageElement.height;
      this.Ctx.drawImage(this.ImageElement, 0, 0);
      this.resetAll();
      this.objectRegonition();
    };
    this.ImageElement.src = src;
  }
  mergeHash(...arg) {
    let ArrSame = [...arg];
    let count = 0;
    ArrSame = ArrSame.map((value) => {
      if (typeof value == "string") {
        count++;
        return value.split("").map((value) => Number(value));
      } else {
        count += value.count;
        return value.hash;
      }
    });
    if (typeof arg[0] == "object") {
      arg[0].hash = new Array(ArrSame[0].length).fill(0).map((val, i) => {
        for (let sval of ArrSame) {
          val += sval[i];
        }
        return val;
      });
      arg[0].count = count;
      return arg[0];
    } else {
      return {
        hash: (function () {
          return new Array(ArrSame[0].length).fill(0).map((val, i) => {
            for (let sval of ArrSame) {
              val += sval[i];
            }
            return val;
          });
        })(),
        count: count,
        id: null,
      };
    }
  }
  mergeHashV2(target: SourceHashList, data: SourceHashList) {
    target.hash = (<number[][]>target.hash).map((color, colorindex) => {
      return color.map((hashvalue, hashindex) => {
        return hashvalue + data.hash[colorindex][hashindex];
      })
    })
    target.count++;
    return target;
  }
  registerWorker() {
    this.worker = new Worker("../auto-detect-hash/detect.worker", { type: "module" });
    this.worker.onmessage = this.MessageDeal.bind(this);
    this.ItemHashList =
      JSON.parse(localStorage.getItem("detect-setting")) ||
      Boolean(
        localStorage.setItem(
          "detect-setting",
          JSON.stringify(this.ItemHashList)
        )
      ) ||
      this.ItemHashList;
    this.resetAll();
  }
  resetAll() {
    this.XBound = [];
    this.YBound = [];
    this.ItemImages = [];
    this.EditGuiReset();
  }
  EditGuiReset() {
    this.ItemImage = "";
    this.ModifyingItem = null;
    this.ModifyBuffer = {};
    this.detectedItem = [];
    this.Lock = false;
    this.RecordItemHash = {};
    this.ItemHashList = this.ItemHashList;
    this.worker.postMessage({
      method: "LoadHashData",
      Data: this.ItemHashList,
    });
    for (let item of this.ItemHashList) {
      this.RecordItemHash[item.id] = {
        count: item.count,
        hash: []
      };
      switch (item.version) {
        case 1:
          Object.assign(this.RecordItemHash[item.id], { hash: (<number[]>item.hash).map(v => Number(v) / item.count), version: item.version });
          break;
        case 2:
          Object.assign(this.RecordItemHash[item.id], { hash: (<number[][]>item.hash).map(v1 => v1.map(v2 => Number(v2) / item.count)), version: item.version });
          break;
      }
    }
    for (const id in this.ItemNames) {
      if (this.ItemNames[id]) {
        if (!(id in this.RecordItemHash)) {
          this.RecordItemHash[id] = {
            id: id,
            hash: [new Array(144).fill(0), new Array(144).fill(0), new Array(144).fill(0)],
            version: 1,
            count: 0,
          };
        }
      }
    }
  }
  objectRegonition() {
    this.worker.postMessage({
      method: "ImageDataLoad",
      data: this.Ctx.getImageData(0, 0, this.Canvas.width, this.Canvas.height),
    });
  }
  MessageDeal(message: MessageEvent) {
    switch (message.data.method) {
      case "status":
        this.InfoText = message.data.text;
        this.progress = message.data.progress;
        break;
      case "clipImage":
        this.XBound = message.data.XBound;
        this.YBound = message.data.YBound;
        this.ImageDatas = [];
        for (let y = 0; y < this.YBound.length; y++) {
          for (let x = 0; x < this.XBound.length; x++) {
            const Canvas = document.createElement("canvas");
            Canvas.width = this.XBound[x][1] - this.XBound[x][0];
            Canvas.height = this.YBound[y][1] - this.YBound[y][0];
            const ctx = Canvas.getContext("2d");
            ctx.drawImage(
              this.ImageElement,
              this.XBound[x][0],
              this.YBound[y][0],
              Canvas.width,
              Canvas.height,
              0,
              0,
              Canvas.width,
              Canvas.height
            );
            let excludePixel = ctx.getImageData(0, 0, Canvas.width, Canvas.height);
            let excludeR = Math.floor((Canvas.width + Canvas.height) / 2);
            let excludeO = [Math.ceil(Canvas.width / 2), Math.floor(Canvas.height / 2)]
            for (let sy = 0; sy < Canvas.height; sy++) {
              for (let sx = 0; sx < Canvas.width; sx++) {
                if (Math.hypot(sx - excludeO[0], sy - excludeO[1]) > excludeR) {
                  excludePixel.data[sy + Canvas.width + sx] = 255;
                  excludePixel.data[sy + Canvas.width + sx + 1] = 255;
                  excludePixel.data[sy + Canvas.width + sx + 2] = 255;
                }
              }
            }
            ctx.putImageData(excludePixel, 0, 0);
            this.ItemImages.push(Canvas);
            const DhashCanvas = document.createElement("canvas");
            DhashCanvas.width = 13;
            DhashCanvas.height = 12;
            const DhashCtx = DhashCanvas.getContext("2d");
            DhashCtx.drawImage(
              Canvas,
              0,
              0,
              Canvas.width,
              Canvas.height,
              0,
              0,
              DhashCanvas.width,
              DhashCanvas.height
            );
            this.ImageDatas.push(
              DhashCtx.getImageData(0, 0, DhashCanvas.width, DhashCanvas.height)
            );
            this.Ctx.strokeRect(
              this.XBound[x][0],
              this.YBound[y][0],
              Canvas.width,
              Canvas.height
            );
          }
        }
        this.worker.postMessage({
          method: "calcDhash",
          ImageDatas: this.ImageDatas,
        });
        break;
      case "SingleItemHash":
        this.detectedItem = message.data.Item;
        for (let id of Object.keys(this.ItemNames)) {
          if (
            !this.detectedItem.some((a) => {
              return a.id == id;
            })
          ) {
            this.detectedItem.push({
              id: id,
              hash: new Array(144).fill(0),
              count: 0,
            });
          }
        }
        let MapFunction = (v) => {
          if (v instanceof Array) {
            return v.map(MapFunction);
          }
          return v.split("").map((a) =>
            Number(a)
          );
        }
        this.OriginHash = message.data.OriginHash.map(MapFunction);
        this.ModifyingItem = {
          id: this.detectedItem[0].id,
          name: this.ItemNames[this.detectedItem[0].id],
          item: this.detectedItem,
        };
        for (const key of Object.keys(this.ModifyingItem)) {
          if (typeof this.ModifyingItem[key] !== "object") {
            this.ModifyBuffer[key] = this.ModifyingItem[key];
          }
        }
        setTimeout(this.GenCompareImage.bind(this), 800);
        break;
    }
  }
  GenCompareImage() {
    let option: echarts.EChartOption
    switch (this.RecordItemHash[this.ModifyBuffer.id].version) {
      case 1:
        option = {
          legend: {
            data: ["Grey"]
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [
            {
              type: <any>'category',
              boundaryGap: false,
              data: Object.keys(new Array(144).fill(0)),
            }
          ],
          yAxis: [
            {
              type: <any>'value',
              name: "相似度/%"
            }
          ],
          series: [
            {
              name: 'Grey',
              type: 'line',
              showSymbol: false,
              areaStyle: {},
              data: (<number[]>this.RecordItemHash[this.ModifyBuffer.id].hash).map((v, i) => {
                if (this.OriginHash[0][i]) {
                  return v * 100;
                } else {
                  return (1 - v) * 100;
                }
              })
            }
          ],
          color: ["#000000"]
        }
        this.hashCompareCanvas = this.el.nativeElement.querySelector("#HashDiff");
        this.hashCompareCanvas.width = this.hashCompareCanvas.clientWidth;
        this.hashCompareCanvas.height = this.hashCompareCanvas.clientHeight;
        this.hashCompareChart = echarts.init(this.hashCompareCanvas);
        this.hashCompareChart.setOption(option,true);
        break;
      case 2:
        option = {
          legend: {
            data: ["R", "G", "B"]
          },
          xAxis: [
            {
              type: <any>'category',
              boundaryGap: false,
              data: Object.keys(new Array(144).fill(0)),
            }
          ],
          yAxis: [
            {
              type: <any>'value',
              name: "相似度/%"
            }
          ],
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          series: [
            {
              name: 'R',
              type: 'line',
              stack: "Color",
              showSymbol: false,
              areaStyle: {},
              data: (<number[][]>this.RecordItemHash[this.ModifyBuffer.id].hash)[0].map((v, i) => {
                if (this.OriginHash[1][0][i]) {
                  return v * 100 / 3;
                } else {
                  return (1 - v) * 100 / 3;
                }
              })
            },
            {
              name: 'G',
              type: 'line',
              stack: "Color",
              showSymbol: false,
              areaStyle: {},
              data: (<number[][]>this.RecordItemHash[this.ModifyBuffer.id].hash)[1].map((v, i) => {
                if (this.OriginHash[1][1][i]) {
                  return v * 100 / 3;
                } else {
                  return (1 - v) * 100 / 3;
                }
              })
            },
            {
              name: 'B',
              type: 'line',
              stack: "Color",
              areaStyle: {},
              showSymbol: false,
              data: (<number[][]>this.RecordItemHash[this.ModifyBuffer.id].hash)[2].map((v, i) => {
                if (this.OriginHash[1][2][i]) {
                  return v * 100 / 3;
                } else {
                  return (1 - v) * 100 / 3;
                }
              })
            }
          ],
          color: ["#ff0000", "#00ff00", "#0000ff"]
        }
        this.hashCompareCanvas = this.el.nativeElement.querySelector("#HashDiff");
        this.hashCompareCanvas.width = this.hashCompareCanvas.clientWidth;
        this.hashCompareCanvas.height = this.hashCompareCanvas.clientHeight;
        this.hashCompareChart = echarts.init(this.hashCompareCanvas);
        this.hashCompareChart.setOption(option,true);
        break;
    }
    return;
  }
  get ModifyingConfidence() {
    let tempData = this.ModifyingItem.item.find((v) => v.id == this.ModifyBuffer.id);
    if (!tempData) {
      return 0;
    }
    if (!("confidence" in tempData)) {
      tempData.confidence = 0;

    }
    return tempData.confidence;
  }
  Merge() {
    if (this.ModifyBuffer.id.toString() == "0000") {
      return;
    }
    let HashList = this.ItemHashList.findIndex(
      (a) => a.id == this.ModifyBuffer.id
    );
    if (HashList === -1) {
      HashList =
        this.ItemHashList.push({
          id: this.ModifyBuffer.id,
          hash: [new Array(144).fill(0), new Array(144).fill(0), new Array(144).fill(0)],
          version: 2,
          count: 0
        }) - 1;
    }

    let NewHashList
    if (this.ItemHashList[HashList].version == 1) {
      NewHashList = this.mergeHash(
        this.ItemHashList[HashList],
        this.OriginHash[0].join("")
      );
    } else {
      NewHashList = this.mergeHashV2(
        this.ItemHashList[HashList],
        this.OriginHash[1]
      );
    }
    NewHashList.id = this.ItemHashList[HashList].id;
    this.ItemHashList[HashList] = NewHashList;
    localStorage.setItem("detect-setting", JSON.stringify(this.ItemHashList));
    this.EditGuiReset();
    this.worker.postMessage({
      method: "calcDhash",
      ImageDatas: this.ImageDatas,
      index: this.XBound.length * this.Modifying.y + this.Modifying.x,
    }); //重算dHash
  }
  Replace() {
    if (this.ModifyBuffer.id.toString() == "0000") {
      return;
    }
    let HashList = this.ItemHashList.find((a) => a.id == this.ModifyBuffer.id);
    if (!HashList) {
      HashList = this.ItemHashList[
        this.ItemHashList.push({
          id: this.ModifyBuffer.id,
          hash: [new Array(144).fill(0), new Array(144).fill(0), new Array(144).fill(0)],
          version: 2,
          count: 0
        }) - 1
      ];
    }
    HashList.count = 1;
    HashList.hash = this.OriginHash[1];
    HashList.version = 2;
    localStorage.setItem("detect-setting", JSON.stringify(this.ItemHashList));
    this.EditGuiReset();
    this.worker.postMessage({
      method: "calcDhash",
      ImageDatas: this.ImageDatas,
      index: this.XBound.length * this.Modifying.y + this.Modifying.x,
    }); //重算dHash
  }
  ChoiceItem(e: MouseEvent, dialog: MdcDialogDirective) {
    const rect = this.Canvas.getBoundingClientRect();
    const clickY = e.offsetY * (this.Canvas.height / rect.height);
    const clickX = e.offsetX * (this.Canvas.width / rect.width);
    let x: number;
    let y: number;
    for (let ya = 0, YAll = this.YBound.length; ya < YAll; ya++) {
      if (this.YBound[ya].length !== 2) {
        continue;
      }
      if (clickY >= this.YBound[ya][0] && clickY <= this.YBound[ya][1]) {
        y = ya;
        break;
      }
    }
    for (let xa = 0, XAll = this.XBound.length; xa < XAll; xa++) {
      if (this.XBound[xa].length !== 2) {
        continue;
      }
      if (clickX >= this.XBound[xa][0] && clickX <= this.XBound[xa][1]) {
        x = xa;
        break;
      }
    }
    if (typeof x === "undefined" || typeof y === "undefined") {
      return;
    }
    this.ItemImage = this.ItemImages[this.XBound.length * y + x].toDataURL();
    this.Modifying.x = x;
    this.Modifying.y = y;
    this.worker.postMessage({
      method: "getItemHashs",
      index: this.XBound.length * y + x,
    });
    dialog.open();
  }
  get Data() {
    return localStorage.getItem("detect-setting");
  }
}
