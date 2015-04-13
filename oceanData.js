var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var moment = require('moment');
var fs = require('fs');

var _URL = 'http://edw.epa.gov.tw/reportInspectSea.aspx';
var params = {
  county: '全國',
  ocean: '全國',
  area: '全國',
  drain: '全國',
  date: '201502'
};

getOceanData();

function getOceanData () {
  async.waterfall([
    function (){
      request.post({url: _URL, form: params}, function (error, response, body) {
        if(error){
          console.error('Request error.');
        }
        var outputData = parseData(body);
        fs.writeFile('data.json', JSON.stringify(outputData));
        console.log('output: data.json');
      }
      )}
    ], function (err, outputData) {
      if (err) {
        console.error('Error.');
      }

      if (!outputData || outputData.length === 0) {
        console.log('GET NULL');
      }
   });
};

function parseData (html){

  var outputData = {};
  var $ = cheerio.load(html);
  var attr = ['siteName', 'date', 'WT',  'PH', 'EC', 'Depth', 'Temperature', 
    'SS', 'DO', 'Salinity', 'DOS', 'Cd', 'Pb', 'Cu', 'Zn'];

  $('#GroupingGridView1')
    .find('tr.DataTableRowStyle, tr.DataTableAlternatingRowStyle')
    .each(function (number, elem){
      var tds = $(this).find('td');
      var tdBasic = tds.length - 15;
      var siteData = {};
      var siteName =  $(this).find('td').eq(tdBasic)
                      .text().trim().replace(/(\r\n|\n|\r|\s)/g,'');

      var siteID =  $(this).find('td').eq(tdBasic).find('a').attr('onclick');
      siteID = siteID.replace('javascript:openRe(\'ResultSeaSite.aspx?siteid=\',\'','');
      siteID = siteID.replace('\',\'qdata_site\');return false;','');
      siteData['siteID'] = siteID;
      
      for (var i = tdBasic; i < (tdBasic+15); ++i) {
        siteData[attr[i-tdBasic]] = $(this).find('td')
                                   .eq(i)
                                   .text()
                                   .trim()
                                   .replace(/(\r\n|\n|\r|\s)/g,'');
      }
      outputData[siteName] = siteData;
  });
  return outputData;
}
