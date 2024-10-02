@extends('layouts.default')

@section('content')
	<div class="row">
		<div class="col-md-12">

			<div class="page-header">
			 	<h1>Ny spiller</h1>
			</div>

			{{ Form::open(array('route' => 'players.store', 'class' => '')) }}

				<div class="form-group">
					<label class="control-label">Navn</label>
					{{ Form::text('name', null, array('class' => 'form-control')) }}
				</div>

				<div class="form-group">
					<button type="submit" class="btn btn-default">Lagre</button>
				</div>

			{{ Form::close() }}

		</div>
	</div>
@stop