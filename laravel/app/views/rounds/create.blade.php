@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Ny runde</h1>
			</div>

			{{ Form::open(array('route' => 'rounds.store', 'class' => '')) }}

				@foreach ($players as $player)
				<div class="form-group">
					<div class="checkbox">
						<label>
							{{ Form::checkbox('players[]', $player['id']) }}{{ $player['name'] }}
						</label>
					</div>
				</div>
				@endforeach

				<div class="form-group">
					<label class="control-label">Mattis</label>
					<select class="form-control" name="loser_id">
						<option></option>
						@foreach ($players as $player)
							<option value="{{ $player['id'] }}">{{ $player['name'] }}</option>
						@endforeach
					</select>
				</div>

				<div class="form-group">
					<button type="submit" class="btn btn-default">Lagre</button>
				</div>

			{{ Form::close() }}

		</div>
	</div>
@stop