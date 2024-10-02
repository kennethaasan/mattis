@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-6">

			<div class="page-header">
			 	<h1>Tapsprosent</h1>
			</div>

			<div class="table-responsive">
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th class="name">Navn</th>
							<th>Runder</th>
							<th>Mattis</th>
							<th>Tapsprosent</th>
						</tr>
					</thead>
					<tbody>
						@foreach ($players as $player)
							<tr>
								<td class="name">{{ link_to_action('PlayersController@show', $player['name'], $player['id']) }}</td>
								<td>{{ $player['rounds'] }}</td>
								<td>{{ $player['loser'] }}</td>
								<td>{{ $player['loser_percentage'] }} %</td>
							</tr>
						@endforeach
					</tbody>
				</table>
			</div>
		</div>

		<div class="col-md-6">

			<div class="page-header">
			 	<h1>Fettmattis</h1>
			</div>

			<div class="table-responsive">
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th class="name">Navn</th>
							<th>Fettmattis</th>
						</tr>
					</thead>
					<tbody>
						@foreach ($fettrounds as $fettround)
							<tr>
								<td class="name">{{ link_to_action('PlayersController@show', $fettround['name'], $fettround['player_id']) }}</td>
								<td>{{ $fettround['fettmattis'] }}</td>
							</tr>
						@endforeach
					</tbody>
				</table>
			</div>
		</div>

	</div>

	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Runder</h1>
			</div>

			<div class="table-responsive">
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th>Dato/Tid</th>
							<th>Mattis</th>
							<th>Deltagere</th>
							<th>Åpne</th>
						</tr>
					</thead>
					<tbody>
						@foreach ($rounds as $round)
							<tr>
								<td>{{ date('d.m.y, H:i', strtotime($round['created_at'])) }}</td>
								<td>{{ link_to_action('PlayersController@show', $round['loser']->name, $round['loser_id']) }}</td>
								<td>{{ $round->players()->count() }}</td>
								<td>{{ link_to_action('RoundsController@show', 'Åpne', $round['id']) }}</td>
							</tr>
						@endforeach
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<div class="row">
		<div class="col-sm-12 text-center">
			{{ $rounds->links() }}
		</div>
	</div>

@stop