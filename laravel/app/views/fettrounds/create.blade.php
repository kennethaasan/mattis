@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Ny fettmattis</h1>
			</div>

			{{ Form::open(array('route' => 'fettrounds.store', 'class' => '')) }}

				<div class="form-group">
					<label class="control-label">Fettmattis</label>
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