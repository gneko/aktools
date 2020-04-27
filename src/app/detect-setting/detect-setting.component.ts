import { Component, OnInit, ElementRef } from "@angular/core";
import { MdcSnackbarService, MdcDialogDirective } from "@blox/material";
import { FetchService } from "../fetch.service";
import { Router } from "@angular/router";
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
  hashCompareCanvas = document.createElement("canvas");
  hashCompareCtx: CanvasRenderingContext2D;
  hashCompareImage: String;
  constructor(
    private fetchService: FetchService,
    private snackbar: MdcSnackbarService,
    private router: Router,
    private el: ElementRef
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
    this.Canvas = this.el.nativeElement.getElementsByTagName("canvas")[0];
    this.Ctx = this.Canvas.getContext("2d");
    this.hashCompareCanvas.width = 1152;
    this.hashCompareCanvas.height = 220;
    this.hashCompareCtx = this.hashCompareCanvas.getContext("2d");
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
  mergeHashV2(target:SourceHashList,data:SourceHashList) {
    target.hash=(<number[][]>target.hash).map((color,colorindex)=>{
      return color.map((hashvalue,hashindex)=>{
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
        this.GenCompareImage();
        break;
    }
  }
  GenCompareImage() {
    this.hashCompareCtx.clearRect(
      0,
      0,
      this.hashCompareCanvas.width,
      this.hashCompareCanvas.height
    );
    this.hashCompareCtx.beginPath();
    this.hashCompareCtx.moveTo(0, this.hashCompareCanvas.height - 1);
    switch (this.RecordItemHash[this.ModifyBuffer.id].version) {
      case 1:
        for (let [index, value] of (<number[]>this.RecordItemHash[
          this.ModifyBuffer.id
        ].hash).entries()) {
          let x1 = index * (this.hashCompareCanvas.width / 144);
          let y1 =
            this.hashCompareCanvas.height -
            Math.round(
              (this.OriginHash[0][index] == 1 ? value : 1 - value) *
              this.hashCompareCanvas.height
            );
          if (index == 0) this.hashCompareCtx.lineTo(x1, y1);
          if (index == 143) {
            this.hashCompareCtx.lineTo(this.hashCompareCanvas.width - 1, y1);
            break
          }
          let x2 = (index + 1) * (this.hashCompareCanvas.width / 144);
          let y2 =
            this.hashCompareCanvas.height -
            Math.round(
              (this.OriginHash[0][index + 1] == 1
                ? (<number[]>this.RecordItemHash[this.ModifyBuffer.id].hash)[index + 1]
                : 1 - (<number[]>this.RecordItemHash[this.ModifyBuffer.id].hash)[index + 1]) *
              this.hashCompareCanvas.height
            );
          this.hashCompareCtx.lineTo(x2, y2);
        }
        this.hashCompareCtx.lineTo(
          this.hashCompareCanvas.width - 1,
          this.hashCompareCanvas.height - 1
        );
        this.hashCompareCtx.lineWidth = 2;
        this.hashCompareCtx.strokeStyle = "#000000";
        this.hashCompareCtx.stroke();
        this.hashCompareCtx.lineTo(0, this.hashCompareCanvas.height - 1);
        this.hashCompareCtx.closePath();
        this.hashCompareCtx.fillStyle = "#0000007f";
        this.hashCompareCtx.fill();
        this.hashCompareImage = this.hashCompareCanvas.toDataURL("image/png");
        break;
      case 2:
        let HeightList: number[][] = [new Array(144).fill(this.hashCompareCanvas.height), [], []];
        let bgColor = ["#ff0000", "#00ff00", "#0000ff"]
        for (let [color, hash] of this.OriginHash[1].entries()) {
          this.hashCompareCtx.beginPath();
          this.hashCompareCtx.moveTo(0,HeightList[color][0]);
          for (let [index, value] of ((<number[][]>this.RecordItemHash[
            this.ModifyBuffer.id
          ].hash)[color]).entries()) {
            let x1 = index * (this.hashCompareCanvas.width / 144);
            let y1 =
              HeightList[color][index] -
              Math.round(
                (hash[index] == 1 ? value : 1 - value) *
                this.hashCompareCanvas.height / 3
              );
            if (color < 2) HeightList[color + 1][index] = y1;
            if (index == 0) this.hashCompareCtx.lineTo(x1, y1);
            if (index == 143) {
              this.hashCompareCtx.lineTo(this.hashCompareCanvas.width - 1, y1);
              break;
            }
            let x2 = (index + 1) * (this.hashCompareCanvas.width / 144);
            let y2 =
              HeightList[color][index] -
              Math.round(
                (hash[index + 1] == 1
                  ? ((<number[][]>this.RecordItemHash[
                    this.ModifyBuffer.id
                  ].hash)[color])[index + 1]
                  : 1 - ((<number[][]>this.RecordItemHash[
                    this.ModifyBuffer.id
                  ].hash)[color])[index + 1]) *
                this.hashCompareCanvas.height / 3
              );
            this.hashCompareCtx.lineTo(x2, y2);
          }
          this.hashCompareCtx.lineTo(
            this.hashCompareCanvas.width - 1,
            HeightList[color][143] - 1
          );
          this.hashCompareCtx.lineWidth = 2;
          this.hashCompareCtx.strokeStyle = bgColor[color];
          this.hashCompareCtx.stroke();
          for (let backindex = 143; backindex >= 0; backindex--) {
            this.hashCompareCtx.lineTo(backindex * (this.hashCompareCanvas.width / 144), HeightList[color][backindex] - 1 - (color == 0 ? 0 : 1))
          }
        //  this.hashCompareCtx.closePath();
          this.hashCompareCtx.fillStyle = bgColor[color] + "7f";
          this.hashCompareCtx.fill()
        }
        this.hashCompareImage = this.hashCompareCanvas.toDataURL("image/png");
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
