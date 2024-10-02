@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Fettmattiser</h1>
			</div>

			<table class="table table-bordered table-striped">
				<thead>
					<tr>
						<th>Dato/Tid</th>
						<th>Fettmattis</th>
						@if (Auth::check())
							<th>Slett</th>
						@endif
					</tr>
				</thead>
				<tbody>
					@foreach ($fettrounds as $fettround)
						<tr>
							<td>{{ date('d.m.y, H:i', strtotime($fettround['created_at'])) }}</td>
							<td>{{ link_to_action('PlayersController@show', $fettround['loser']->name, $fettround['loser_id']) }}</td>
							@if (Auth::check())
								<td>
									{{ Form::open(array('route' => array('fettrounds.destroy', $fettround['id']), 'method' => 'delete')) }}
								        <button type="submit" class="btn btn-xs btn-danger delete-fett">Slett</button>
								    {{ Form::close() }}
								</td>
							@endif
						</tr>
					@endforeach
				</tbody>
			</table>
		</div>
	</div>

	<div class="row">
		<div class="col-sm-12 text-center">
			{{ $fettrounds->links() }}
		</div>
	</div>
@stop