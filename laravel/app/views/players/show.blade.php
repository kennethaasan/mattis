@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>{{ $player['name'] }}</h1>
			</div>

		</div>
	</div>

	<div class="row">
		<div class="col-md-6">

			<div class="page-header">
			 	<h3>Tapsprosent</h3>
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
						<tr>
							<td class="name">{{ $player['name'] }}</td>
							<td>{{ $player['rounds'] }}</td>
							<td>{{ $player['loser'] }}</td>
							<td>{{ $player['loser_percentage'] }} %</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="col-md-6">

			<div class="page-header">
			 	<h3>Fettmattis</h3>
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
								<td class="name">{{ $fettround['name'] }}</td>
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
			 	<h3>Runder hvor denne spilleren er mattis</h3>
			</div>

			<div class="table-responsive">
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th>Dato/Tid</th>
							<th>Deltagere</th>
							<th>Åpne</th>
						</tr>
					</thead>
					<tbody>
						@foreach ($rounds_mattis as $round)
							<tr>
								<td>{{ date('d.m.y, H:i', strtotime($round['created_at'])) }}</td>
								<td>{{ $round->players()->count() }}</td>
								<td>{{ link_to_action('RoundsController@show', 'Åpne', $round['id']) }}</td>
							</tr>
						@endforeach
					</tbody>
				</table>
			</div>
		</div>

		<div class="col-sm-12 text-center">
			{{ Paginator::setPageName('rounds_mattis') }}
			{{ $rounds_mattis->appends('rounds_participate', Input::get('rounds_participate', 1))->links() }}
		</div>

	</div>

	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h3>Runder med deltagelse</h3>
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
						@foreach ($rounds_participate as $round)
							<tr>
								<td>{{ date('d.m.y, H:i', strtotime($round['created_at'])) }}</td>
								<td>{{ $round['loser']->name }}</td>
								<td>{{ $round->players()->count() }}</td>
								<td>{{ link_to_action('RoundsController@show', 'Åpne', $round['id']) }}</td>
							</tr>
						@endforeach
					</tbody>
				</table>
			</div>
		</div>

		<div class="col-sm-12 text-center">
			{{ Paginator::setPageName('rounds_participate') }}
			{{ $rounds_participate->appends('rounds_mattis', Input::get('rounds_mattis', 1))->links() }}
		</div>

	</div>

@stop