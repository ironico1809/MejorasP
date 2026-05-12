from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('usuarios', '0005_usuario_roles_table'),
    ]

    operations = [
        migrations.CreateModel(
            name='BitacoraEvento',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                (
                    'usuario',
                    models.ForeignKey(
                        blank=True,
                        db_constraint=False,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name='eventos_bitacora',
                        to='usuarios.usuario',
                    ),
                ),
                ('nom_usuario', models.CharField(blank=True, max_length=50, null=True)),
                ('accion', models.CharField(max_length=50)),
                ('modulo', models.CharField(max_length=50)),
                ('entidad', models.CharField(blank=True, max_length=50, null=True)),
                ('entidad_id', models.CharField(blank=True, max_length=64, null=True)),
                ('detalle', models.TextField(blank=True, null=True)),
                ('metodo', models.CharField(blank=True, max_length=10, null=True)),
                ('path', models.TextField(blank=True, null=True)),
                ('ip', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'db_table': 'bitacora_eventos',
                'ordering': ['-created_at', '-id'],
            },
        ),
    ]
