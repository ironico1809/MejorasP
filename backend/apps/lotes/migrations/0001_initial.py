from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('galpones', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Lote',
            fields=[
                ('id_lote', models.AutoField(primary_key=True, serialize=False)),
                (
                    'galpon',
                    models.ForeignKey(
                        db_column='id_galpon',
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name='lotes',
                        to='galpones.galpon',
                    ),
                ),
                ('raza_tipo', models.CharField(blank=True, max_length=50, null=True)),
                ('fecha_ingreso', models.DateField(default=django.utils.timezone.localdate)),
                ('fecha_salida_estimada', models.DateField(blank=True, null=True)),
                ('cantidad_inicial', models.IntegerField()),
                ('cantidad_actual', models.IntegerField()),
                ('peso_inicial', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('estado', models.CharField(default='Crianza', max_length=20)),
            ],
            options={
                'db_table': 'lote',
            },
        ),
    ]
