import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { NvD3Component } from 'ng2-nvd3';
import { FinancialService } from '../../../shared/shared-services/financial/financial.service';
import * as d3 from 'd3';
import * as $ from 'jquery';
import * as html2canvas from "html2canvas";
import { AdminService } from '../../../shared/shared-services/admin/admin.service';
import * as tableexport from 'tableexport';
import { ToastrService } from 'ngx-toastr';
declare const moment: any;

@Component({
  selector: 'app-health-check-reports',
  templateUrl: './health-check-reports.component.html',
  styleUrls: ['./health-check-reports.component.css']
})
export class HealthCheckReportsComponent implements OnInit {
  public reportData: any;
  public options: any;
  public leftoptions: any;
  public data: any;
  public api: any;
  public reportdrillData: any = {};
  public selectedRecord: any;
  public showDrill: boolean = false;
  public isLoading: boolean = false;
  public colours: Array<string>;
  public newColours: any;
  public selecteddrillDate: any;
  public reportdrilldate: any;
  public isdrillLoading: boolean = false;
  public selectedFilter: string;
  public selectedprocess:any;
  public selecteddrillFilter: string;
  public tableOptions: any;
  public weekrangestart:number;
  public weekrangeend:number;

  public filterYear:number;
  constructor(private _financialservice: FinancialService, private _adminservice: AdminService,private _toastr:ToastrService) {
  }

  ngOnInit() {
    this.selectedFilter = "total";
    this.filterYear = (new Date).getFullYear();
    this.weekrangestart=1;
    this.isLoading = true;
    this.colours = ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5", "#393b79", "#5254a3", "#6b6ecf", "#9c9ede", "#637939", "#8ca252", "#b5cf6b", "#cedb9c", "#8c6d31", "#bd9e39", "#e7ba52", "#e7cb94", "#843c39", "#ad494a", "#d6616b", "#e7969c", "#7b4173", "#a55194", "#ce6dbd", "#de9ed6"];
    //d3.scale.category20().range().concat(d3.scale.category20b().range().slice(0));
    // var self = this;
    
    this._financialservice.loadHealthData(this.selectedFilter).subscribe((data: { result: object }) => {
      this.reportData = data.result;
      this.isLoading = false;
      this.weekrangeend=data.result["headers"].length-1;
      setTimeout(() => {
        let headerwidth = (this.reportData.headers.length * 38) + "px";
        document.getElementById('reports-tbl').style.width = headerwidth;
        setTimeout(() => {
          // let newwidth = document.getElementById('reports-tbl').offsetWidth + (this.reportData.headers.length * 0.25) + "px";

          //create instance to download excel,csv

          var ExportButtons = document.getElementById('tbldownload');
          this.tableOptions = new tableexport.TableExport(ExportButtons, {
            formats: ['xls', 'csv'],
            exportButtons: false
          });
        }, 100);
      }, 300);
    });
  }
  public getPng() {
    document.getElementById('downloadtableicons').style.display = "none";
    document.getElementById('report-container').style.width = ((<HTMLElement>document.getElementsByClassName('tabledivright')[0]).scrollWidth + (<HTMLElement>document.getElementsByClassName('tabledivleft')[0]).scrollWidth + 10) + "px";
    html2canvas($("#report-container").get(0)).then(canvas => {
      var url = canvas.toDataURL();
      $("<a>", {
        href: url,
        download: "WeeklyReport-" + Date.now().toString()
      })
        .on("click", function () { $(this).remove() })
        .appendTo("body")[0].click();

      document.getElementById('report-container').style.width = "";
      document.getElementById('downloadtableicons').style.display = "block";
    });
  }

  

  public truncateto20(processName: string) {
    if (processName && processName.length > 19)
      return processName.slice(0, 20);
    else
      return processName;
  }

  public backtoReport() {
    this.showDrill = false;
  }

  public openDrilldown(wkNmber: string, wkValue: string, procName: string, name: string) {
    let DateOfWeek1 = moment(moment().format("YYYY")).add(parseInt(wkNmber)-1, 'weeks');
    let DateOfWeek2 = moment(moment().format("YYYY")).add(parseInt(wkNmber), 'weeks');
    let monthofWeek1 = DateOfWeek1.format("MMM YYYY");
    let monthofWeek ='';
    let monthofWeek2 = DateOfWeek2.format("MMM YYYY");
    if(monthofWeek2 === monthofWeek1){ 
       monthofWeek = monthofWeek1;
    }else{
       monthofWeek = monthofWeek1 +' - ' +monthofWeek2;
    }
    this.selectedRecord = {
      "week_number": wkNmber,
      "week_value": wkValue,
      "week_year": moment().format("YYYY"),
      "proc_name": procName,
      "name": name,
      "DateofWeek": monthofWeek
    };
    this.showDrill = true;
    this.reportdrilldate = null;
    this.selecteddrillFilter = this.selectedFilter;

    this.isdrillLoading = true;
    this._adminservice.getDrillDowndataforhealthReport(name, wkNmber, moment().format("YYYY"), this.selectedFilter).subscribe((data: { result: object }) => {
      this.drillDownData(data);
    });
  }

  public loaddrillReportByFilter(filter: string) {
    this.isdrillLoading = true;
    let selectedRec = this.selectedRecord;
    this._adminservice.getDrillDowndataforhealthReport(selectedRec.name, selectedRec.week_number, moment().format("YYYY"), filter).subscribe((data: { result: object }) => {
      this.drillDownData(data);
    });
  }
  drillDownData(data) {
    this.reportdrillData = data;
      this.isdrillLoading = false;
      if (this.reportdrillData && this.reportdrillData.result && this.reportdrillData.result.length != 0) {
        let firstRecord = this.reportdrillData.result[0];
        this.drillRuns(firstRecord["day"], firstRecord["records"]);
      }
  }

  public drillRuns(drillDate: string, drillRuns: any) {
    this.selecteddrillDate = drillDate;
    this.reportdrilldate = drillRuns;
  }

  public loadReportByFilter(filterBy: string) {

      if(this.weekrangestart < 1 || this.weekrangeend < 1){
       this._toastr.info("Week From (or) Week To must be positive numbers !", 'Information!');
        return;
      }
      if(this.weekrangestart > this.weekrangeend){
        this._toastr.info("Week From must be greater than Week To !", 'Information!');
        return;
      }

    this.isLoading = true;
    this._financialservice.loadHealthData(this.selectedFilter).subscribe((data: { result: object }) => {
      this.reportData = {};
      let tmpresult = data.result;
      if(this.weekrangestart && this.weekrangeend){
        let weekrangestart = this.weekrangestart;
        let weekrangeend = this.weekrangeend;
        tmpresult["headers"] = tmpresult["headers"].slice(weekrangestart,weekrangeend+1);
        tmpresult["headers"].unshift("week");
      
    }
    let newtmp = {};
    newtmp["headers"] =tmpresult["headers"];

    if(this.selectedprocess && this.selectedprocess.length>0){
     newtmp["graph_data"]=[];
     newtmp["data"]=[];
      for(let i=0;i<this.selectedprocess.length;i++){
        for(let j=0; j< tmpresult["graph_data"].length;j++){
          if(tmpresult["graph_data"][j].key==this.selectedprocess[i]){
            newtmp["graph_data"].push(tmpresult["graph_data"][j]);
          }
        }
      }
      for(let i=0;i<this.selectedprocess.length;i++){
        for(let j=0; j< tmpresult["data"].length;j++){
          if(tmpresult["data"][j].week==this.selectedprocess[i]){
            newtmp["data"].push(tmpresult["data"][j]);
          }
        }
      }
    }else{
      newtmp["graph_data"] = tmpresult["graph_data"];
      newtmp["data"]=tmpresult["data"];
    }

    let graphdata = newtmp["graph_data"];
    newtmp["graph_data"] = [];
      this.reportData = newtmp; //tmpresult; //data.result;
      this.isLoading = false;
      setTimeout(() => {
      if(this.reportData.headers.length == 1) {
         return;
        } else {
        let headerwidth = (this.reportData.headers.length * 38) + "px";
        document.getElementById('reports-tbl').style.width = headerwidth;
        setTimeout(() => {
          // let newwidth = document.getElementById('reports-tbl').offsetWidth + (this.reportData.headers.length * 0.25) + "px";
          newtmp["graph_data"] = graphdata;
          console.log();
          var ExportButtons = document.getElementById('tbldownload');
          this.tableOptions = new tableexport.TableExport(ExportButtons, {
            formats: ['xls', 'csv'],
            exportButtons: false
          });
        }, 100);
      }
      }, 300);
    });
  }

  public getDay(edate: string) {
    var check = moment(edate, 'YYYY/MM/DD');
    return check.format('D');
  }

  public getDate(edate: string) {
    if (edate == "-")
      return "-";
    var check = moment(edate, 'YYYY/MM/DD  hh:mm:ss');
    return check.format('DD MMM, h:mm:ss a')
  };

  public downloadasExcel(extension) {
    //this.tableOptions.reset(); 
    tableexport.TableExport.prototype["typeConfig"].date.assert = function(v){return false;};
    var exportData = this.tableOptions.getExportData()['tbldownload'][extension];
    this.tableOptions.export2file(exportData.data, exportData.mimeType,"Weeklythroughput"+Date.now(),exportData.fileExtension);
  }
}

