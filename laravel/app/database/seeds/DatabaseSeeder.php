<?php


use \Faker\Factory as Faker;

class DatabaseSeeder extends Seeder {

	/**
	 * Run the database seeds.
	 *
	 * @return void
	 */
	public function run()
	{
        Eloquent::unguard();

		$this->call('UserTableSeeder');
		$this->command->info('User table seeded!');

        $this->call('PlayerTableSeeder');
        $this->command->info('Player tables seeded!');

        $this->call('RoundTableSeeder');
        $this->command->info('Round tables seeded!');

        $this->call('FettroundTableSeeder');
        $this->command->info('Fettround tables seeded!');

	}

}

class UserTableSeeder extends Seeder {

    public function run()
    {
        DB::table('users')->delete();

        User::create(array(
            'username' => 'vanvikil',
            'password' => Hash::make('mattis')
        ));

    }
}

class PlayerTableSeeder extends Seeder {
    public function run()
    {
        DB::table('players')->delete();

        Player::create(array('name' => 'Kenneth Aasan'));
        Player::create(array('name' => 'Hallvard Hermstad'));
        Player::create(array('name' => 'Stian Solstad'));
        Player::create(array('name' => 'Robert Solstad'));
        Player::create(array('name' => 'Stian Darell'));
        Player::create(array('name' => 'Borgar K. Hindrum'));
        Player::create(array('name' => 'Geir Johnny Rolitrø'));
        Player::create(array('name' => 'Aleksander W. Solheim'));
        Player::create(array('name' => 'Håkon Fjeldvær'));
        Player::create(array('name' => 'Martin B. Fjeldvær'));


    }
}

class RoundTableSeeder extends Seeder {
    public function run()
    {
        DB::table('rounds')->delete();
        DB::table('player_round')->delete();

        $faker = Faker::create();

        foreach (range(1, 101) as $index) {
            $round = Round::create(array(
                'loser_id' => $faker->numberBetween(1, 10)
            ));

            $round->players()->sync(array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10));
        }

    }
}

class FettroundTableSeeder extends Seeder {
    public function run()
    {
        DB::table('fettrounds')->delete();

        $faker = Faker::create();

        foreach (range(1, 30) as $index) {
            $round = Fettround::create(array(
                'loser_id' => $faker->numberBetween(1, 10)
            ));
        }

    }
}


