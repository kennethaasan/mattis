@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Månedsstatistikk</h1>
			</div>

			<div id="chart" style="width:100%; height:500px;"></div>


		</div>



	</div>


<script src="http://code.highcharts.com/highcharts.js"></script>
<script>
function convertToSeries(players) {
	for (var i = 0; i < players.length; i++) {
		players[i].data = $.map(players[i].months.loser_percentage, function(value, index) {
		    return [value];
		});
	}

	return players;
}

$(function () {

    // Get the data
    $.getJSON('api/months', function (data) {

    	data.players = convertToSeries(data.players);

        $('#chart').highcharts({
	        title: {
	            text: '',
	            x: -20 //center
	        },
	        credits: {
	            enabled: false
	        },
	        xAxis: {
	            categories: data.months

	        },
	        yAxis: {
	            title: {
	                text: 'Tapsprosent'
	            },
	            min: 0,
	        },
	        tooltip: {
	            valueSuffix: '%'
	        },
	        /*legend: {
	            layout: 'vertical',
	            align: 'right',
	            verticalAlign: 'middle',
	            borderWidth: 0
	        },*/
	        series: data.players
	    });
    });

});
</script>

@stop