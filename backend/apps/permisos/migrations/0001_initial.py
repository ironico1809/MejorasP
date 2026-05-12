from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('usuarios', '0005_usuario_roles_table'),
    ]

    operations = [
        migrations.CreateModel(
            name='Permiso',
            fields=[
                ('id_permiso', models.AutoField(primary_key=True, serialize=False)),
                ('nombre', models.CharField(max_length=100, unique=True)),
                ('descripcion', models.TextField(blank=True, null=True)),
            ],
            options={
                'db_table': 'permisos',
            },
        ),
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS rol_permisos (
                rol_id INTEGER REFERENCES rol(id_rol) ON DELETE CASCADE,
                permiso_id INTEGER REFERENCES permisos(id_permiso) ON DELETE CASCADE,
                PRIMARY KEY (rol_id, permiso_id)
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS rol_permisos;
            """,
        ),
    ]
