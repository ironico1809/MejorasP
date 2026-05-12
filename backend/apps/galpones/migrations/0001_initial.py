from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Galpon',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('capacidad', models.IntegerField()),
                ('descripcion', models.TextField(blank=True, null=True)),
                ('estado', models.CharField(default='activo', max_length=20)),
            ],
            options={
                'db_table': 'galpones',
            },
        ),
    ]
