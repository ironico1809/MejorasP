from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def _ensure_alimentacion_table_exists(apps, schema_editor):
	"""Crea la tabla `alimentacion` si no existe.

	No usa `apps.get_model()` porque en `SeparateDatabaseAndState` el registry puede
	no contener la app durante la fase de `database_operations`.
	"""
	connection = schema_editor.connection
	existing_tables = {name.lower() for name in connection.introspection.table_names()}
	if 'alimentacion' in existing_tables:
		return

	vendor = connection.vendor
	if vendor == 'postgresql':
		schema_editor.execute(
			"""
			CREATE TABLE IF NOT EXISTS alimentacion (
				id_alimentacion SERIAL PRIMARY KEY,
				id_lote INT NOT NULL,
				fecha DATE NOT NULL,
				cantidad_kg DECIMAL(6,2) NOT NULL,
				tipo_alimento VARCHAR(100),
				observacion TEXT,
				CONSTRAINT alimentacion_id_lote_fkey FOREIGN KEY (id_lote) REFERENCES lote (id_lote)
			);
			"""
		)
	else:
		# sqlite3 (dev) y fallback genérico
		schema_editor.execute(
			"""
			CREATE TABLE IF NOT EXISTS alimentacion (
				id_alimentacion INTEGER PRIMARY KEY AUTOINCREMENT,
				id_lote INTEGER NOT NULL,
				fecha DATE NOT NULL,
				cantidad_kg NUMERIC(6,2) NOT NULL,
				tipo_alimento VARCHAR(100) NULL,
				observacion TEXT NULL,
				FOREIGN KEY (id_lote) REFERENCES lote (id_lote)
			);
			"""
		)


class Migration(migrations.Migration):

	initial = True

	dependencies = [
		('lotes', '0001_initial'),
	]

	operations = [
		migrations.SeparateDatabaseAndState(
			state_operations=[
				migrations.CreateModel(
					name='Alimentacion',
					fields=[
						('id_alimentacion', models.AutoField(primary_key=True, serialize=False)),
						('fecha', models.DateField(default=django.utils.timezone.localdate)),
						('cantidad_kg', models.DecimalField(decimal_places=2, max_digits=6)),
						('tipo_alimento', models.CharField(blank=True, max_length=100, null=True)),
						('observacion', models.TextField(blank=True, null=True)),
						(
							'lote',
							models.ForeignKey(
								db_column='id_lote',
								on_delete=django.db.models.deletion.PROTECT,
								related_name='alimentaciones',
								to='lotes.lote',
							),
						),
					],
					options={
						'db_table': 'alimentacion',
						'ordering': ['-fecha', '-id_alimentacion'],
					},
				),
			],
			database_operations=[
				migrations.RunPython(_ensure_alimentacion_table_exists, reverse_code=migrations.RunPython.noop),
			],
		),
	]
