@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Runde #{{ $round['id'] }} - {{ date('d.m.y, H:i', strtotime($round['created_at'])) }}</h1>
			</div>

		</div>

		<div class="col-md-12">
			<table class="table table-bordered table-striped">
				<thead>
					<tr>
						<th class="name">Navn</th>
					</tr>
				</thead>
				<tbody>
					@foreach ($players as $player)
						<tr>

							@if ($player['id'] == $round['loser_id'])
								<td class="name warning">{{ $player['name'] }}</td>
							@else
								<td class="name">{{ $player['name'] }}</td>
							@endif
						</tr>
					@endforeach
				</tbody>
			</table>
		</div>

		@if (Auth::check())
			<div class="col-md-12">
				{{ Form::open(array('route' => array('rounds.destroy', $round['id']), 'method' => 'delete')) }}
			        <button type="submit" class="btn btn-danger" id="delete">Slett</button>
			    {{ Form::close() }}
			</div>
		@endif

	</div>
@stop